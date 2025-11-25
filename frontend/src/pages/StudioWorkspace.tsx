import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import "./StudioWorkspace.css";

import AddToolsModal from "../components/studio/AddToolsModal";
import ToolsPanel from "../components/studio/ToolsPanel";
import PromptsSection from "../components/studio/PromptsSection";
import FlowSection from "../components/studio/FlowSection";

import {
  fetchUserTools,
  fetchMCPServers,
} from "../api/tools";

import { createAssistant, updateAssistantGraph } from "../api/assistants";
import { createRun } from "../api/runs";

import type {
  UserToolConnection,
  MCPServer,
  Message,
  AgentNode,
} from "../types/api";

const StudioWorkspace: React.FC = () => {
  const navigate = useNavigate();

  const [showAddToolsModal, setShowAddToolsModal] = useState(false);
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useState(false);

  // NEW: tools data
  const [userTools, setUserTools] = useState<UserToolConnection[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [prompts, setPrompts] = useState<AgentNode[]>([]);
  const [flowOrder, setFlowOrder] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

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
    } catch (error: any) {
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

  useEffect(() => {
    loadTools();
  }, []);

  const buildGraphJson = () => {
    // Build graph_json from prompts and flowOrder
    const nodes = prompts.map((prompt) => ({
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

      // Create a temporary assistant
      const assistant = await createAssistant({
        name: `Temp Assistant - ${new Date().toISOString()}`,
        description: "Temporary assistant for testing workflow",
      });

      // Update the assistant with the graph
      await updateAssistantGraph(assistant.id, graphJson);

      // Run the workflow
      const result = await createRun(assistant.id, inputText);

      // Set messages from the result
      setMessages(result.messages);
      setInputText(""); // Clear input after successful run

      // Optionally delete the temporary assistant after a delay
      // (or keep it for reference)
    } catch (err: any) {
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
              className="studio-workspace-primary-button"
              onClick={() => setShowAddToolsModal(true)}
            >
              + Add Tools
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
            <ToolsPanel
              onAddTools={() => setShowAddToolsModal(true)}
              tools={userTools}
              mcpServers={mcpServers}
              loading={loadingTools}
              error={toolsError}
            />

            <PromptsSection
              prompts={prompts}
              onPromptsChange={(newPrompts) => {
                setPrompts(newPrompts);
                setFlowOrder((prev) =>
                  prev.filter((id) => newPrompts.some((p) => p.id === id))
                );
              }}
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
                <span className="studio-workspace-chip">MCP Preview</span>
              </div>

              <div className="studio-workspace-chat-window">
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
                      // ✅ last agent is the last non-user sender in history
                      const lastAgentMessage = [...messages].reverse().find(
                        (m) => m.sender !== "user"
                      );
                      const lastAgentId = lastAgentMessage?.sender;

                      const visible = lastAgentId
                        ? messages.filter(
                            (m) => m.sender === "user" || m.sender === lastAgentId
                          )
                        : messages;

                      return visible.map((msg) => (
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
                            {msg.sender === "user" ? "user" : msg.sender}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#2C2416" }}>
                            {msg.sender === "user" ? (
                              <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                            ) : (
                              <ReactMarkdown
                                remarkPlugins={[remarkBreaks]}
                                components={{
                                  h1: ({children, ...props}: any) => <h1 style={{fontSize: '1.4em', fontWeight: 'bold', marginTop: '0.8em', marginBottom: '0.5em'}} {...props}>{children}</h1>,
                                  h2: ({children, ...props}: any) => <h2 style={{fontSize: '1.2em', fontWeight: 'bold', marginTop: '0.8em', marginBottom: '0.5em'}} {...props}>{children}</h2>,
                                  h3: ({children, ...props}: any) => <h3 style={{fontSize: '1.1em', fontWeight: 'bold', marginTop: '0.6em', marginBottom: '0.4em'}} {...props}>{children}</h3>,
                                  ul: ({children, ...props}: any) => <ul style={{marginLeft: '1.2em', marginTop: '0.5em', marginBottom: '0.5em', paddingLeft: '0.5em'}} {...props}>{children}</ul>,
                                  ol: ({children, ...props}: any) => <ol style={{marginLeft: '1.2em', marginTop: '0.5em', marginBottom: '0.5em', paddingLeft: '0.5em'}} {...props}>{children}</ol>,
                                  li: ({children, ...props}: any) => <li style={{marginBottom: '0.3em', lineHeight: '1.5'}} {...props}>{children}</li>,
                                  p: ({children, ...props}: any) => <p style={{marginBottom: '0.6em', lineHeight: '1.6'}} {...props}>{children}</p>,
                                  strong: ({children, ...props}: any) => <strong style={{fontWeight: 'bold'}} {...props}>{children}</strong>,
                                  blockquote: ({children, ...props}: any) => <blockquote style={{borderLeft: '3px solid #ccc', paddingLeft: '0.8em', marginLeft: '0', marginTop: '0.5em', marginBottom: '0.5em', fontStyle: 'italic'}} {...props}>{children}</blockquote>,
                                }}
                              >{msg.content}</ReactMarkdown>
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
