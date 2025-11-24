import React, { useState } from "react";
import type { AgentNode } from "../../types/api";

interface PromptsSectionProps {
  prompts: AgentNode[];
  onPromptsChange: (prompts: AgentNode[]) => void;
}

const PromptsSection: React.FC<PromptsSectionProps> = ({
  prompts,
  onPromptsChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editPrompt, setEditPrompt] = useState("");

  const handleAddPrompt = () => {
    const newId = `prompt-${Date.now()}`;
    const newPrompt: AgentNode = {
      id: newId,
      label: `Agent ${prompts.length + 1}`,
      role: `Agent ${prompts.length + 1}`,
      system_prompt: "",
      tool_refs: [],
    };
    onPromptsChange([...prompts, newPrompt]);
    setEditingId(newId);
    setEditLabel(newPrompt.label);
    setEditPrompt(newPrompt.system_prompt);
  };

  const handleEdit = (prompt: AgentNode) => {
    setEditingId(prompt.id);
    setEditLabel(prompt.label);
    setEditPrompt(prompt.system_prompt);
  };

  const handleSave = () => {
    if (!editingId) return;
    const updated = prompts.map((p) =>
      p.id === editingId
        ? { ...p, label: editLabel, system_prompt: editPrompt }
        : p
    );
    onPromptsChange(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onPromptsChange(prompts.filter((p) => p.id !== id));
  };

  return (
    <div className="studio-workspace-section">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h2 className="studio-workspace-title">Prompts</h2>
        <button
          className="studio-workspace-ghost-button"
          onClick={handleAddPrompt}
          style={{ fontSize: "0.85rem", padding: "6px 12px" }}
        >
          + Add Prompt
        </button>
      </div>

      {prompts.length === 0 ? (
        <p className="studio-workspace-text">
          Add prompts to define your agents. Each prompt represents an agent in
          your workflow.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              style={{
                border: "1px solid rgba(148, 163, 184, 0.3)",
                borderRadius: "8px",
                padding: "12px",
                background: "rgba(15, 23, 42, 0.5)",
              }}
            >
              {editingId === prompt.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    placeholder="Agent name"
                    style={{
                      background: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid rgba(148, 163, 184, 0.5)",
                      borderRadius: "6px",
                      padding: "6px 8px",
                      color: "#f9fafb",
                      fontSize: "0.85rem",
                    }}
                  />
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="System prompt for this agent..."
                    rows={3}
                    style={{
                      background: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid rgba(148, 163, 184, 0.5)",
                      borderRadius: "6px",
                      padding: "6px 8px",
                      color: "#f9fafb",
                      fontSize: "0.85rem",
                      resize: "vertical",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setEditingId(null)}
                      className="studio-workspace-secondary-button"
                      style={{ fontSize: "0.8rem", padding: "4px 8px" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="studio-workspace-primary-button"
                      style={{ fontSize: "0.8rem", padding: "4px 8px" }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "#e5e7eb",
                        margin: 0,
                      }}
                    >
                      {prompt.label}
                    </h3>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => handleEdit(prompt)}
                        className="studio-workspace-secondary-button"
                        style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className="studio-workspace-secondary-button"
                        style={{ fontSize: "0.75rem", padding: "4px 8px", color: "#f97373" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#9ca3af",
                      margin: 0,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {prompt.system_prompt || "No prompt set"}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromptsSection;

