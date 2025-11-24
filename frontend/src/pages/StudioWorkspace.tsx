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

  const [messages] = useState<Message[]>([]);
  const [prompts, setPrompts] = useState<AgentNode[]>([]);
  const [flowOrder, setFlowOrder] = useState<string[]>([]);

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
                            {msg.sender === "user" ? "user" : "assistant"}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#2C2416" }}>
                            {msg.content}
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
                />
                <button className="studio-workspace-primary-button">
                  Run Workflow
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
