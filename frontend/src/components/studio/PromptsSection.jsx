import React, { useState } from "react";
import { verifyGmailTool } from "../../api/tools.js";
import styles from "./PromptsSection.module.css";

const PromptsSection = ({
  prompts,
  onPromptsChange,
  toolOptions,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editPrompt, setEditPrompt] = useState("");

  const handleAddPrompt = () => {
    const newId = `agent-${Date.now()}`;
    const newPrompt = {
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

  const handleEdit = (prompt) => {
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

  const handleDelete = (id) => {
    onPromptsChange(prompts.filter((p) => p.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  // Toggle a tool for a specific agent
  const handleToggleTool = async (
    agentId,
    tool,
    checked
  ) => {
    // If unchecking, just remove it
    if (!checked) {
      const updated = prompts.map((agent) => {
        if (agent.id !== agentId) return agent;
        const existingRefs = agent.tool_refs || [];
        const filtered = existingRefs.filter(
          (ref) => !(ref.kind === tool.kind && ref.id === tool.id)
        );
        return {
          ...agent,
          tool_refs: filtered,
        };
      });
      onPromptsChange(updated);
      return;
    }

    // If checking Gmail tool, only verify if not already connected
    // Check if tool is Gmail by looking at the label (which is template_key for user_tool)
    const isGmailTool = tool.kind === "user_tool" && tool.label.toLowerCase() === "gmail";
    const isAlreadyConnected = tool.subtitle === "connected";

    // Only verify if Gmail is NOT already connected
    if (isGmailTool && !isAlreadyConnected) {
      try {
        // Verify Gmail authorization
        const verifyResponse = await verifyGmailTool(tool.id);
        
        // If auth_url is provided, user needs to authorize
        if (verifyResponse.auth_url) {
          // Redirect to OAuth
          window.location.href = verifyResponse.auth_url;
          return; // Don't add tool yet, wait for OAuth callback
        }
        
        // If no auth_url, credentials are valid, proceed with assignment
      } catch (error) {
        console.error("Failed to verify Gmail tool:", error);
        alert(`Gmail is not authorized. Please go to Add Tools and connect Gmail first.`);
        return; // Don't add tool if verification fails
      }
    }

    // Add tool to agent
    const updated = prompts.map((agent) => {
      if (agent.id !== agentId) return agent;

      const existingRefs = agent.tool_refs || [];

      // Check if already present
      const already = existingRefs.some(
        (ref) => ref.kind === tool.kind && ref.id === tool.id
      );
      if (already) return agent;

      const newRef = {
        kind: tool.kind,
        id: tool.id,
      };

      return {
        ...agent,
        tool_refs: [...existingRefs, newRef],
      };
    });

    onPromptsChange(updated);
  };

  // Helper to show nice label for attached tools in view mode
  const findToolLabel = (ref) => {
    if (!toolOptions || toolOptions.length === 0) {
      return `${ref.kind} #${ref.id}`;
    }
    const match = toolOptions.find(
      (t) => t.kind === ref.kind && t.id === ref.id
    );
    return match ? match.label : `${ref.kind} #${ref.id}`;
  };

  const findToolSubtitle = (ref) => {
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
