import React, { useState } from "react";
import type { AgentNode } from "../../types/api";
import styles from "./PromptsSection.module.css";

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
    const newId = `agent-${Date.now()}`;
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
      p.id === editingId ? { ...p, label: editLabel, system_prompt: editPrompt } : p
    );
    onPromptsChange(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onPromptsChange(prompts.filter((p) => p.id !== id));
  };

  return (
    <div className={styles.section}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Agents</h2>
        <button className={styles.ghostButton} onClick={handleAddPrompt}>
          + Add Agent
        </button>
      </div>

      {prompts.length === 0 ? (
        <p className={styles.text}>
          Add agents to define roles and system prompts for your workflow.
        </p>
      ) : (
        <div className={styles.list}>
          {prompts.map((prompt) => (
            <div key={prompt.id} className={styles.card}>
              {editingId === prompt.id ? (
                <div className={styles.editForm}>
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    placeholder="Agent name"
                    className={styles.input}
                  />
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="System prompt for this agent..."
                    rows={3}
                    className={styles.textarea}
                  />
                  <div className={styles.actions}>
                    <button
                      onClick={() => setEditingId(null)}
                      className={styles.secondaryButton}
                    >
                      Cancel
                    </button>
                    <button onClick={handleSave} className={styles.primaryButton}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.agentName}>{prompt.label}</h3>
                    <div className={styles.cardActions}>
                      <button
                        onClick={() => handleEdit(prompt)}
                        className={styles.secondaryButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className={styles.promptText}>
                    {prompt.system_prompt || "No system prompt set"}
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
 
