import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

import "./StudioWorkspace.css";
import AddToolsModal from "../components/studio/AddToolsModal";
import ToolsPanel from "../components/studio/ToolsPanel";
import PromptsSection from "../components/studio/PromptsSection";
import FlowSection from "../components/studio/FlowSection";
import {fetchUserTools,fetchMCPServers, deleteUserTool, deleteMCPServer} from "../api/tools.js";
import { createAssistant, updateAssistantGraph } from "../api/assistants.js";
import { createRun } from "../api/runs.js";

// Fix broken markdown patterns from LLM output
const preprocessMarkdown = (text) => {
  return text
    // Fix broken bold: "**\n\nText\n\n**" → "**Text**"
    .replace(/\*\*\s*\n+\s*/g, '**')
    .replace(/\s*\n+\s*\*\*/g, '**')
    // Fix "**\n\n**" patterns (empty bold)
    .replace(/\*\*\s*\*\*/g, '')
    // Fix isolated "**" on lines
    .replace(/^\s*\*\*\s*$/gm, '')
    // Fix "*\n\n" patterns (broken bullets)
    .replace(/^\*\s*$/gm, '')
    // Fix numbered lists with broken formatting: "2.\n\n" → proper list
    .replace(/^(\d+)\.\s*\n+/gm, '$1. ')
    // Fix merged words: add space between lowercase and uppercase (camelCase breaks)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Fix merged words after punctuation without space
    .replace(/([.,:;!?])([A-Z])/g, '$1 $2')
    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove leading/trailing whitespace from lines
    .split('\n').map(line => line.trim()).join('\n')
    .trim();
};

const StudioWorkspace = () => {
  const navigate = useNavigate();

  const [showAddToolsModal, setShowAddToolsModal] = useState(false);
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useState(false);

  // NEW: tools data
  const [userTools, setUserTools] = useState([]);
  const [mcpServers, setMcpServers] = useState([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [toolsError, setToolsError] = useState(null);

  const [messages, setMessages] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [flowOrder, setFlowOrder] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState(null);
  const [tempAssistantId, setTempAssistantId] = useState(null); // For testing only
  const [isDeploying, setIsDeploying] = useState(false);
  const [assistantName, setAssistantName] = useState("");
  const [assistantDescription, setAssistantDescription] = useState("");
  const chatWindowRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const toolOptions = [...userTools.map((tool) => ({
    id: tool.id,
    kind: "user_tool",
    label : tool.template_key,
    subtitle : tool.status,
  })),
  ...mcpServers.map((server)=>({
    id:server.id,
    kind: "mcp_server",
    label: server.name,
    subtitle: server.server_type
  }))

]

  const loadTools = async () => {
    try {
      setLoadingTools(true);
      setToolsError(null);

      const [toolsResp, mcpResp] = await Promise.all([
        fetchUserTools(),
        fetchMCPServers(),
      ]);

      setUserTools(toolsResp);
      setMcpServers(mcpResp);
    } catch (error) {
      console.error("Failed to load tools:", error);
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to load tools";
      setToolsError(message);
    } finally {
      setLoadingTools(false);
    }
  };
  const handleDeleteTool = async (toolId) => {
    try {
      await deleteUserTool(toolId);
      setUserTools((prev) => prev.filter((t)=> t.id !== toolId));
    }
    catch (error){
      console.error("Failed to delete tool:", error);
    }
  };

  const handleDeleteMcpServer = async (serverId) => {
    try {
      await deleteMCPServer(serverId);
      setMcpServers((prev) => prev.filter((s) => s.id !== serverId));
    }
    catch (error) {
      console.error("Failed to delete MCP server:", error);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  // Handle OAuth callback for Gmail
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const warning = params.get('warning');
    
    if (success === 'gmail_connected') {
      // Reload tools to show the newly connected Gmail
      loadTools();
      // Show success message
      alert('Gmail connected successfully!');
      // Clean up URL
      navigate('/studio', { replace: true });
    } else if (error) {
      alert(`Error connecting Gmail: ${error}`);
      navigate('/studio', { replace: true });
    } else if (warning) {
      alert(`Warning: ${warning}`);
      navigate('/studio', { replace: true });
    }
  }, [navigate]);

  const buildGraphJson = () => {
    // Build graph_json from prompts - ONLY include agents that are in the flowOrder
    // and order them according to flowOrder
    const nodes = flowOrder
      .map((agentId) => prompts.find((p) => p.id === agentId))
      .filter((prompt) => prompt !== undefined)
      .map((prompt) => ({
        id: prompt.id,
        type: "agent",
        role: prompt.role || prompt.label,
        system_prompt: prompt.system_prompt,
        tool_refs: prompt.tool_refs || [],
      }));

    // Build edges from flowOrder
    const edges = [];
    for (let i = 0; i < flowOrder.length - 1; i++) {
      edges.push({
        from: flowOrder[i],
        to: flowOrder[i + 1],
      });
    }

    return { nodes, edges };
  };

  const handleRunWorkflow = async () => {
    if (!inputText.trim()) {
      setRunError("Please enter a message to run the workflow.");
      return;
    }

    if (prompts.length === 0) {
      setRunError("Please add at least one agent prompt before running.");
      return;
    }

    if (flowOrder.length === 0) {
      setRunError("Please define the flow order before running.");
      return;
    }

    try {
      setIsRunning(true);
      setRunError(null);

      // Build graph_json from prompts and flowOrder
      const graphJson = buildGraphJson();

      let assistantId = tempAssistantId;

      // Create a TEMPORARY assistant for testing (will be deleted or reused)
      if (!assistantId) {
        const assistant = await createAssistant({
          name: `_temp_test_${Date.now()}`,
          description: "Temporary assistant for Studio testing",
        });
        assistantId = assistant.id;
        setTempAssistantId(assistantId);
      }

      // Always update the assistant with the latest graph
      await updateAssistantGraph(assistantId, graphJson);

      // Run the workflow
      const result = await createRun(assistantId, inputText);

      // APPEND new messages to existing ones (filter out duplicates by id)
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMessages = result.messages.filter((m) => !existingIds.has(m.id));
        return [...prev, ...newMessages];
      });
      
      setInputText(""); // Clear input after successful run
    } catch (err) {
      console.error("Failed to run workflow:", err);
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to run workflow";
      setRunError(errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDeploy = async () => {
    if (!assistantName.trim()) {
      setRunError("Please enter a name for your assistant in the left panel.");
      return;
    }

    if (prompts.length === 0) {
      setRunError("Please add at least one agent before deploying.");
      return;
    }

    if (flowOrder.length === 0) {
      setRunError("Please define the flow order before deploying.");
      return;
    }

    try {
      setIsDeploying(true);
      setRunError(null);

      const graphJson = buildGraphJson();

      // Create the REAL assistant with user's chosen name
      const assistant = await createAssistant({
        name: assistantName.trim(),
        description: assistantDescription.trim() || "Multi-agent assistant deployed from Studio",
      });

      // Update with the graph
      await updateAssistantGraph(assistant.id, graphJson);

      // Navigate to the assistant in dashboard
      navigate(`/assistants/${assistant.id}`);
    } catch (err) {
      console.error("Failed to deploy:", err);
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to deploy assistant";
      setRunError(errorMessage);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <>
      <div
        className={`studio-workspace-shell ${
          isDashboardCollapsed ? "dashboard-collapsed" : ""
        }`}
      >
        <header className="studio-workspace-header">
          <div className="studio-workspace-nav">
            <button
              className="studio-workspace-back-button"
              onClick={() => navigate("/")}
            >
              Back
            </button>
            <div>
              <p className="studio-workspace-label">Multi-Agent Studio</p>
              <h1 className="studio-workspace-page-title">Workspace</h1>
            </div>
          </div>
          <div className="studio-workspace-header-actions">
            <button
              className="studio-workspace-ghost-button"
              onClick={() =>
                setIsDashboardCollapsed((previous) => !previous)
              }
            >
              {isDashboardCollapsed ? "Show Overview" : "Hide Overview"}
            </button>
            <button
              className="studio-workspace-secondary-button"
              onClick={() => setShowAddToolsModal(true)}
            >
              + Add Tools
            </button>
            <button
              className="studio-workspace-deploy-button"
              onClick={handleDeploy}
              disabled={isDeploying || prompts.length === 0 || !assistantName.trim()}
            >
              {isDeploying ? "Deploying..." : "🚀 Deploy"}
            </button>
          </div>
        </header>

        <div className="studio-workspace-root">
          {/* Left column - Tools + Agents + Flow */}
          <aside
            className={`studio-workspace-column studio-workspace-left ${
              isDashboardCollapsed ? "collapsed" : ""
            }`}
          >
            {/* Assistant Name Section */}
            <div className="studio-workspace-section studio-workspace-name-section">
              <h2 className="studio-workspace-title">Assistant Details</h2>
              <div className="studio-workspace-name-field">
                <label className="studio-workspace-field-label">Name *</label>
                <input
                  type="text"
                  className="studio-workspace-name-input"
                  placeholder="e.g., Research Assistant"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                />
              </div>
              <div className="studio-workspace-name-field">
                <label className="studio-workspace-field-label">Description</label>
                <input
                  type="text"
                  className="studio-workspace-name-input"
                  placeholder="What does this assistant do?"
                  value={assistantDescription}
                  onChange={(e) => setAssistantDescription(e.target.value)}
                />
              </div>
              {!assistantName.trim() && (
                <p className="studio-workspace-hint">Enter a name to enable Deploy</p>
              )}
            </div>

            <ToolsPanel
              onAddTools={() => setShowAddToolsModal(true)}
              onDeleteTool={handleDeleteTool}
              onDeleteMcpServer={handleDeleteMcpServer}
              tools={userTools}
              mcpServers={mcpServers}
              loading={loadingTools}
              error={toolsError}
            />

            <PromptsSection
              prompts={prompts}
              onPromptsChange={(newPrompts) => {
                // Detect if a new agent was added
                const newAgentIds = newPrompts
                  .map((p) => p.id)
                  .filter((id) => !prompts.some((p) => p.id === id));
                
                setPrompts(newPrompts);
                
                setFlowOrder((prev) => {
                  // Remove deleted agents from flow
                  const filtered = prev.filter((id) => 
                    newPrompts.some((p) => p.id === id)
                  );
                  // Auto-add new agents to end of flow
                  return [...filtered, ...newAgentIds];
                });
              }}
              toolOptions = {toolOptions}
            />

            <FlowSection
              prompts={prompts}
              flowOrder={flowOrder}
              onFlowOrderChange={setFlowOrder}
            />
          </aside>

          {/* Center: Chat */}
          <main className="studio-workspace-column studio-workspace-center">
            <div className="studio-workspace-section studio-workspace-chat">
              <div className="studio-workspace-chat-header">
                <div>
                  <p className="studio-workspace-label">Studio Chat</p>
                  <h2 className="studio-workspace-title-lg">
                    Compose & orchestrate workflows
                  </h2>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {messages.length > 0 && (
                    <button
                      className="studio-workspace-ghost-button"
                      onClick={() => {
                        setMessages([]);
                        setTempAssistantId(null);
                      }}
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                    >
                      Clear Chat
                    </button>
                  )}
                  <span className="studio-workspace-chip">MCP Preview</span>
                </div>
              </div>

              <div className="studio-workspace-chat-window" ref={chatWindowRef}>
                {runError && (
                  <div
                    style={{
                      padding: "12px",
                      background: "#fee",
                      borderRadius: "8px",
                      border: "1px solid #fcc",
                      marginBottom: "12px",
                      color: "#c00",
                    }}
                  >
                    Error: {runError}
                  </div>
                )}
                {messages.length === 0 ? (
                <p className="studio-workspace-text">
                    Add prompts and define flow, then test your workflow here.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {(() => {
                      // Group messages: show user messages + only the LAST agent response per conversation turn
                      const displayMessages = [];
                      let lastAgentMsg = null;

                      messages.forEach((msg, idx) => {
                        if (msg.sender === "user") {
                          // Before adding new user message, add the last agent response
                          if (lastAgentMsg) {
                            displayMessages.push(lastAgentMsg);
                            lastAgentMsg = null;
                          }
                          displayMessages.push(msg);
                        } else {
                          // Keep track of the latest agent message
                          lastAgentMsg = msg;
                        }
                        // If this is the last message and it's an agent, add it
                        if (idx === messages.length - 1 && lastAgentMsg) {
                          displayMessages.push(lastAgentMsg);
                        }
                      });

                      return displayMessages.map((msg) => (
                        <div
                          key={msg.id}
                          style={{
                            padding: "12px",
                            background:
                              msg.sender === "user"
                                ? "rgba(107, 91, 79, 0.15)"
                                : "#F5F1E8",
                            borderRadius: "8px",
                            border: "1px solid #E8E0D4",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#8B7A6B",
                              marginBottom: "4px",
                            }}
                          >
                            {msg.sender === "user" ? "You" : "Assistant"}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#2C2416" }}>
                            {msg.sender === "user" ? (
                              <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                            ) : (
                              <ReactMarkdown
                                remarkPlugins={[remarkBreaks]}
                                components={{
                                  h1: ({children, ...props}) => <h1 style={{fontSize: '1.4em', fontWeight: 'bold', marginTop: '0.8em', marginBottom: '0.5em'}} {...props}>{children}</h1>,
                                  h2: ({children, ...props}) => <h2 style={{fontSize: '1.2em', fontWeight: 'bold', marginTop: '0.8em', marginBottom: '0.5em'}} {...props}>{children}</h2>,
                                  h3: ({children, ...props}) => <h3 style={{fontSize: '1.1em', fontWeight: 'bold', marginTop: '0.6em', marginBottom: '0.4em'}} {...props}>{children}</h3>,
                                  ul: ({children, ...props}) => <ul style={{marginLeft: '1.2em', marginTop: '0.5em', marginBottom: '0.5em', paddingLeft: '0.5em'}} {...props}>{children}</ul>,
                                  ol: ({children, ...props}) => <ol style={{marginLeft: '1.2em', marginTop: '0.5em', marginBottom: '0.5em', paddingLeft: '0.5em'}} {...props}>{children}</ol>,
                                  li: ({children, ...props}) => <li style={{marginBottom: '0.3em', lineHeight: '1.5'}} {...props}>{children}</li>,
                                  p: ({children, ...props}) => <p style={{marginBottom: '0.6em', lineHeight: '1.6'}} {...props}>{children}</p>,
                                  strong: ({children, ...props}) => <strong style={{fontWeight: 'bold'}} {...props}>{children}</strong>,
                                  blockquote: ({children, ...props}) => <blockquote style={{borderLeft: '3px solid #D4C9B8', paddingLeft: '0.8em', marginLeft: '0', marginTop: '0.5em', marginBottom: '0.5em', fontStyle: 'italic', color: '#5A4A3A'}} {...props}>{children}</blockquote>,
                                }}
                              >{preprocessMarkdown(msg.content)}</ReactMarkdown>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              <div className="studio-workspace-chat-input-row">
                <input
                  className="studio-workspace-chat-input"
                  placeholder="Ask your assistant or describe a workflow..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleRunWorkflow();
                    }
                  }}
                  disabled={isRunning}
                />
                <button
                  className="studio-workspace-primary-button"
                  onClick={handleRunWorkflow}
                  disabled={isRunning}
                >
                  {isRunning ? "Running..." : "Run Workflow"}
                </button>
              </div>
            </div>
          </main>

          {/* Right: Helper */}
          <aside className="studio-workspace-column studio-workspace-right">
            <div className="studio-workspace-section studio-workspace-helper">
              <h2 className="studio-workspace-title">Helper</h2>
              <p className="studio-workspace-text">
                Logs, quick references, helper agents — coming soon.
              </p>
              <div className="studio-workspace-helper-actions">
                <button className="studio-workspace-secondary-button">
                  View Logs
                </button>
                <button className="studio-workspace-secondary-button">
                  Tips
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showAddToolsModal && (
        <AddToolsModal onclose={() => {
          setShowAddToolsModal(false);
          loadTools(); // <- important: refresh tools after connecting
        }} />
      )}
    </>
  );
};

export default StudioWorkspace;
