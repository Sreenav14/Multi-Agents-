import React from "react";
import type { AgentNode } from "../../types/api";

interface FlowSectionProps {
  prompts: AgentNode[];
  flowOrder: string[]; // Array of prompt IDs in execution order
  onFlowOrderChange: (order: string[]) => void;
}

const FlowSection: React.FC<FlowSectionProps> = ({
  prompts,
  flowOrder,
  onFlowOrderChange,
}) => {
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...flowOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onFlowOrderChange(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === flowOrder.length - 1) return;
    const newOrder = [...flowOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onFlowOrderChange(newOrder);
  };

  const handleRemoveFromFlow = (promptId: string) => {
    onFlowOrderChange(flowOrder.filter((id) => id !== promptId));
  };

  const handleAddToFlow = (promptId: string) => {
    if (!flowOrder.includes(promptId)) {
      onFlowOrderChange([...flowOrder, promptId]);
    }
  };

  // Get prompts not in flow
  const availablePrompts = prompts.filter((p) => !flowOrder.includes(p.id));

  if (prompts.length === 0) {
    return (
      <div className="studio-workspace-section">
        <h2 className="studio-workspace-title">Flow</h2>
        <p className="studio-workspace-text">
          Add prompts first to define the execution order.
        </p>
      </div>
    );
  }

  return (
    <div className="studio-workspace-section">
      <h2 className="studio-workspace-title">Flow</h2>
      <p className="studio-workspace-text" style={{ marginBottom: "12px" }}>
        Define the order in which prompts will process the user's query (e.g., 1→2→3 or 3→1→2).
      </p>

      {/* Flow Order Display */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        {flowOrder.length === 0 ? (
          <p className="studio-workspace-text" style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            No prompts in flow. Add prompts below to define execution order.
          </p>
        ) : (
          flowOrder.map((promptId, index) => {
            const prompt = prompts.find((p) => p.id === promptId);
            if (!prompt) return null;

            return (
              <div key={promptId}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "1px solid rgba(148, 163, 184, 0.3)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    background: "rgba(59, 130, 246, 0.1)",
                  }}
                >
                  <div
                    style={{
                      minWidth: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "rgba(59, 130, 246, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#93c5fd",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#e5e7eb",
                      }}
                    >
                      {prompt.label}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="studio-workspace-secondary-button"
                      style={{
                        fontSize: "0.7rem",
                        padding: "4px 8px",
                        opacity: index === 0 ? 0.5 : 1,
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === flowOrder.length - 1}
                      className="studio-workspace-secondary-button"
                      style={{
                        fontSize: "0.7rem",
                        padding: "4px 8px",
                        opacity: index === flowOrder.length - 1 ? 0.5 : 1,
                      }}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleRemoveFromFlow(promptId)}
                      className="studio-workspace-secondary-button"
                      style={{
                        fontSize: "0.7rem",
                        padding: "4px 8px",
                        color: "#f97373",
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                {index < flowOrder.length - 1 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "4px 0",
                      fontSize: "1.2rem",
                      color: "rgba(148, 163, 184, 0.5)",
                    }}
                  >
                    ↓
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Available Prompts to Add */}
      {availablePrompts.length > 0 && (
        <div>
          <p
            className="studio-workspace-text"
            style={{ fontSize: "0.8rem", marginBottom: "8px", color: "#9ca3af" }}
          >
            Add to flow:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {availablePrompts.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => handleAddToFlow(prompt.id)}
                className="studio-workspace-ghost-button"
                style={{ fontSize: "0.75rem", padding: "6px 10px" }}
              >
                + {prompt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowSection;
