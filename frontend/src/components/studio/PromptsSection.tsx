import React, { useState } from "react";
import type { AgentNode, ToolRef } from "../../types/api";
import styles from "./PromptsSection.module.css";

type ToolOption = {
  id: number;
  kind: "user_tool" | "mcp_server";
  label: string;
  subtitle?: string;
};

type PromptsSectionProps = {
  prompts: AgentNode[];
  onPromptsChange: (prompts: AgentNode[]) => void;
  toolOptions?: ToolOption[];
};

const PromptsSection: React.FC<PromptsSectionProps> = ({
  prompts,
  onPromptsChange,
  toolOptions,
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
    if (editingId === id) {
      setEditingId(null);
    }
  };

  // Toggle a tool for a specific agent
  const handleToggleTool = (
    agentId: string,
    tool: ToolOption,
    checked: boolean
  ) => {
    const updated: AgentNode[] = prompts.map((agent) => {
      if (agent.id !== agentId) return agent;

      const existingRefs = agent.tool_refs || [];

      if (checked) {
        // add if not already present
        const already = existingRefs.some(
          (ref) => ref.kind === tool.kind && ref.id === tool.id
        );
        if (already) return agent;

        const newRef: ToolRef = {
          kind: tool.kind,
          id: tool.id,
        };

        return {
          ...agent,
          tool_refs: [...existingRefs, newRef],
        };
      } else {
        // remove
        const filtered = existingRefs.filter(
          (ref) => !(ref.kind === tool.kind && ref.id === tool.id)
        );
        return {
          ...agent,
          tool_refs: filtered,
        };
      }
    });

    onPromptsChange(updated);
  };

  // Helper to show nice label for attached tools in view mode
  const findToolLabel = (ref: ToolRef): string => {
    if (!toolOptions || toolOptions.length === 0) {
      return `${ref.kind} #${ref.id}`;
    }
    const match = toolOptions.find(
      (t) => t.kind === ref.kind && t.id === ref.id
    );
    return match ? match.label : `${ref.kind} #${ref.id}`;
  };

  const findToolSubtitle = (ref: ToolRef): string | undefined => {
    if (!toolOptions || toolOptions.length === 0) return undefined;
    const match = toolOptions.find(
      (t) => t.kind === ref.kind && t.id === ref.id
    );
    return match?.subtitle;
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
          Add agents to define roles, system prompts, and attached tools for your workflow.
        </p>
      ) : (
        <div className={styles.list}>
          {prompts.map((prompt) => {
            const isEditing = editingId === prompt.id;

            return (
              <div key={prompt.id} className={styles.card}>
                {isEditing ? (
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

                    {/* Tools selector (edit mode) */}
                    <div className={styles.toolsSection}>
                      <div className={styles.toolsHeaderRow}>
                        <span className={styles.toolsLabel}>Attached tools</span>
                        {(!toolOptions || toolOptions.length === 0) && (
                          <span className={styles.toolsHint}>
                            No tools yet – connect them in the Tools panel.
                          </span>
                        )}
                      </div>

                      {toolOptions && toolOptions.length > 0 && (
                        <div className={styles.toolsGrid}>
                          {toolOptions.map((tool) => {
                            const isChecked =
                              prompt.tool_refs?.some(
                                (ref) =>
                                  ref.kind === tool.kind && ref.id === tool.id
                              ) ?? false;

                            return (
                              <label
                                key={`${tool.kind}:${tool.id}`}
                                className={styles.toolChip}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) =>
                                    handleToggleTool(
                                      prompt.id,
                                      tool,
                                      e.target.checked
                                    )
                                  }
                                />
                                <span className={styles.toolMain}>
                                  {tool.label}
                                </span>
                                {tool.subtitle && (
                                  <span className={styles.toolSub}>
                                    {tool.subtitle}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className={styles.actions}>
                      <button
                        onClick={() => setEditingId(null)}
                        className={styles.secondaryButton}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className={styles.primaryButton}
                      >
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

                    {/* Tools summary (view mode) */}
                    <div className={styles.toolsSummary}>
                      <span className={styles.toolsLabel}>Tools:</span>
                      {prompt.tool_refs && prompt.tool_refs.length > 0 ? (
                        <ul className={styles.toolsSummaryList}>
                          {prompt.tool_refs.map((ref, idx) => (
                            <li key={`${ref.kind}:${ref.id}:${idx}`}>
                              <span className={styles.toolMain}>
                                {findToolLabel(ref)}
                              </span>
                              {findToolSubtitle(ref) && (
                                <span className={styles.toolSub}>
                                  {findToolSubtitle(ref)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className={styles.toolsEmpty}>None</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PromptsSection;
