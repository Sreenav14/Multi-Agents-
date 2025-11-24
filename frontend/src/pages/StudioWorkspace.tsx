import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  AgentNode,
  Message,
} from "../types/api";

const StudioWorkspace: React.FC = () => {
  const navigate = useNavigate();

  const [showAddToolsModal, setShowAddToolsModal] = useState(false);
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useState(false);

  // Tools data
  const [userTools, setUserTools] = useState<UserToolConnection[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);

  // Prompts and Flow
  const [prompts, setPrompts] = useState<AgentNode[]>([]);
  const [flowOrder, setFlowOrder] = useState<string[]>([]); // Array of prompt IDs in execution order
  const [assistantId, setAssistantId] = useState<number | null>(null);
  const [assistantName, setAssistantName] = useState("My Assistant");

  // Chat
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Deploy
  const [isDeploying, setIsDeploying] = useState(false);

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

  // Helper function to create graph structure from flow order
  const createGraphFromFlow = () => {
    const flowEdges = flowOrder
      .slice(0, -1)
      .map((sourceId, index) => ({
        from: sourceId,
        to: flowOrder[index + 1],
      }));

    const orderedNodes = flowOrder
      .map((promptId) => {
        const prompt = prompts.find((p) => p.id === promptId);
        if (!prompt) return null;
        return {
          id: prompt.id,
          type: "agent",
          role: prompt.role || prompt.label,
          system_prompt: prompt.system_prompt,
          tool_refs: prompt.tool_refs || [],
        };
      })
      .filter(Boolean);

    return { nodes: orderedNodes, edges: flowEdges };
  };

  const handleRunWorkflow = async () => {
    const inputText = chatInput.trim();
    if (!inputText || flowOrder.length === 0) {
      alert("Please add prompts to flow and enter a message");
      return;
    }

    // Save input and clear field
    const currentInput = inputText;
    setChatInput("");

    // Create temporary assistant if not exists
    let currentAssistantId = assistantId;
    if (!currentAssistantId) {
      try {
        const assistant = await createAssistant({
          name: assistantName || "Untitled Assistant",
          description: "Created in Studio",
        });
        currentAssistantId = assistant.id;
        setAssistantId(assistant.id);

        const graph = createGraphFromFlow();
        await updateAssistantGraph(assistant.id, graph as any);
      } catch (error: any) {
        alert(`Failed to create assistant: ${error.message}`);
        setChatInput(currentInput);
        return;
      }
    }

    setIsRunning(true);
    try {
      const response = await createRun(
        currentAssistantId,
        currentInput,
        chatId || undefined
      );

      setChatId(response.chat_id);
      setMessages((prev) => [...prev, ...response.messages]);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || "Unknown error";
      alert(`Failed to run workflow: ${errorMessage}`);
      setChatInput(currentInput);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDeploy = async () => {
    if (flowOrder.length === 0) {
      alert("Please add prompts to flow before deploying");
      return;
    }

    if (!assistantName.trim()) {
      const name = prompt("Enter a name for your assistant:");
      if (!name) return;
      setAssistantName(name);
    }

    setIsDeploying(true);
    try {
      let currentAssistantId = assistantId;
      if (!currentAssistantId) {
        const assistant = await createAssistant({
          name: assistantName || "Untitled Assistant",
          description: "Created in Studio",
        });
        currentAssistantId = assistant.id;
        setAssistantId(assistant.id);
      }

      const graph = createGraphFromFlow();
      await updateAssistantGraph(currentAssistantId, graph as any);

      alert("Assistant deployed successfully! It's now available on the dashboard.");
      navigate("/dashboard");
    } catch (error: any) {
      alert(`Failed to deploy: ${error.message}`);
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
              onClick={() => navigate("/dashboard")}
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
              onClick={handleDeploy}
              disabled={isDeploying || flowOrder.length === 0}
            >
              {isDeploying ? "Deploying..." : "Deploy"}
            </button>
            <button
              className="studio-workspace-ghost-button"
              onClick={() => setShowAddToolsModal(true)}
            >
              + Add Tools
            </button>
          </div>
        </header>

        <div className="studio-workspace-root">
          {/* Left column - Tools + Prompts + Flow */}
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
                    Test your workflow
                  </h2>
                </div>
              </div>

              <div className="studio-workspace-chat-window">
                {messages.length === 0 ? (
                  <p className="studio-workspace-text">
                    Add prompts and define flow, then test your workflow here.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {messages.map((msg) => (
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
                          {msg.sender}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#2C2416" }}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="studio-workspace-chat-input-row">
                <input
                  className="studio-workspace-chat-input"
                  placeholder="Ask your assistant or describe a workflow..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
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
                  disabled={isRunning || flowOrder.length === 0}
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
                {prompts.length > 0 ? (
                  <>
                    <strong>Prompts:</strong> {prompts.length}
                    <br />
                    <strong>In Flow:</strong> {flowOrder.length}
                    {flowOrder.length > 0 && (
                      <>
                        <br />
                        <strong>Order:</strong>{" "}
                        {flowOrder
                          .map((id) => prompts.find((p) => p.id === id)?.label || id)
                          .join(" → ")}
                      </>
                    )}
                  </>
                ) : (
                  "Add prompts to start building your workflow."
                )}
              </p>
              <div style={{ marginTop: "12px" }}>
                <label
                  style={{
                    fontSize: "0.75rem",
                    color: "#6B5B4F",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Assistant Name
                </label>
                <input
                  type="text"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  placeholder="Assistant name"
                  style={{
                    background: "#FAF8F3",
                    border: "1px solid #D4C9B8",
                    borderRadius: "6px",
                    padding: "6px 8px",
                    color: "#2C2416",
                    fontSize: "0.85rem",
                    width: "100%",
                  }}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showAddToolsModal && (
        <AddToolsModal
          onclose={() => {
            setShowAddToolsModal(false);
            loadTools();
          }}
        />
      )}
    </>
  );
};

export default StudioWorkspace;
