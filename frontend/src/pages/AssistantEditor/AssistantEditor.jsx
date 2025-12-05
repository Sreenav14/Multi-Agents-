import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import "../StudioWorkspace.css"; // reuse existing 3-column layout styles

import { fetchAssistant, updateAssistantGraph } from "../../api/assistants.js";
import { getAssistantGraph } from "../../utils/assistantGraph.js";

const AssistantEditor = () => {
  const { assistantId } = useParams();
  const navigate = useNavigate();

  const [assistant, setAssistant] = useState(null);
  const [graph, setGraph] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGraph, setEditedGraph] = useState(null);

  const handleSave = async () => {
    if (!assistant || !editedGraph) return;
    try {
      await updateAssistantGraph(assistant.id, editedGraph);
      setGraph(editedGraph);
      setIsEditing(false);
      alert("Assistant updated successfully");
    } catch (err) {
      console.error("Failed to save:",err);
      alert("Failed to save assistant");
    }

    };

  // Load assistant by id
  useEffect(() => {
    if (!assistantId) return;

    const id = Number(assistantId);
    if (Number.isNaN(id)) {
      setError("Invalid assistant id");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchAssistant(id);
        setAssistant(data);

        const g = getAssistantGraph(data);
        setGraph(g);

        if (g.nodes.length > 0) {
          setSelectedAgentId(g.nodes[0].id);
        }
      } catch (err) {
        console.error("Failed to load assistant", err);
        const message =
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load assistant";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [assistantId]);

  const selectedAgent = useMemo(() => {
    // When editing, use editedGraph; otherwise use graph
    const sourceGraph = isEditing && editedGraph ? editedGraph : graph;
    if (!sourceGraph || !selectedAgentId) return undefined;
    return sourceGraph.nodes.find((n) => n.id === selectedAgentId);
  }, [graph, editedGraph, selectedAgentId, isEditing]);

  // Simple loading / error states
  if (loading && !assistant) {
    return <div className="studio-workspace-shell">Loading assistant…</div>;
  }

  if (error && !assistant) {
    return (
      <div className="studio-workspace-shell">
        <p>Error: {error}</p>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  if (!assistant || !graph) {
    return (
      <div className="studio-workspace-shell">
        <p>Assistant not found.</p>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  return (
    <div className="studio-workspace-shell">
      <header className="studio-workspace-header">
        <div className="studio-workspace-nav">
          <button
            className="studio-workspace-back-button"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
          <div>
            <p className="studio-workspace-label">Assistant Editor</p>
            <h1 className="studio-workspace-page-title">
              {assistant.name}
            </h1>
          </div>
        </div>
        <div className="studio-workspace-header-actions">
    {isEditing && editedGraph && (
      <button
        className="studio-workspace-primary-button"
        onClick={handleSave}
      >
        Save Changes
      </button>
    )}
    <button
      className="studio-workspace-ghost-button"
      onClick={() => {
        if (isEditing) {
          // Cancel editing - reset to original graph
          setEditedGraph(null);
          setIsEditing(false);
        } else {
          // Start editing - copy current graph
          setEditedGraph(graph);
          setIsEditing(true);
        }
      }}
    >
      {isEditing ? "Cancel" : "Edit"}
    </button>
  </div>
      </header>

      <div className="studio-workspace-root">
        {/* Left: agent list */}
        <aside className="studio-workspace-column studio-workspace-left">
          <div className="studio-workspace-section">
            <h2 className="studio-workspace-title">Agents</h2>
            {graph.nodes.length === 0 ? (
              <p className="studio-workspace-text">
                No agents defined yet. We&apos;ll add an &quot;Add
                Agent&quot; flow in the next steps.
              </p>
            ) : (
              <ul className="studio-workspace-agent-list">
                {graph.nodes.map((node) => (
                  <li
                    key={node.id}
                    className={`studio-workspace-agent-item ${
                      node.id === selectedAgentId ? "selected" : ""
                    }`}
                    onClick={() => setSelectedAgentId(node.id)}
                  >
                    <div className="studio-workspace-agent-name">
                      {node.label}
                    </div>
                    <div className="studio-workspace-agent-meta">
                      {node.role || "agent"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Center: selected agent details (read-only for now) */}
        <main className="studio-workspace-column studio-workspace-center">
          <div className="studio-workspace-section studio-workspace-chat">
            {selectedAgent ? (
              <>
                <div className="studio-workspace-chat-header">
                  <div>
                    <p className="studio-workspace-label">Agent</p>
                    <h2 className="studio-workspace-title-lg">
                      {selectedAgent.label}
                    </h2>
                  </div>
                </div>

                <div className="studio-workspace-chat-window">
  {isEditing ? (
    // ✅ EDIT MODE: Show editable fields
    <>
      <h3 className="studio-workspace-subtitle">System prompt</h3>
      <textarea
        value={
          editedGraph?.nodes.find((n) => n.id === selectedAgentId)?.system_prompt || ""
        }
        onChange={(e) => {
          if (!editedGraph) return;
          const updated = {
            ...editedGraph,
            nodes: editedGraph.nodes.map((n) =>
              n.id === selectedAgentId
                ? { ...n, system_prompt: e.target.value }
                : n
            ),
          };
          setEditedGraph(updated);
        }}
        placeholder="Enter system prompt..."
        rows={6}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "6px",
          border: "1px solid #E8E0D4",
          fontFamily: "inherit",
          fontSize: "0.9rem",
          resize: "vertical",
        }}
      />

                  <h3 className="studio-workspace-subtitle" style={{ marginTop: "24px" }}>
                    Attached tools (tool_refs)
                  </h3>
                  <p className="studio-workspace-text">
                    To assign tools, use the StudioWorkspace page. Tool editing will be added here soon.
                  </p>
                </>
              ) : (
                // ✅ VIEW MODE: Show read-only display
                <>
                  <h3 className="studio-workspace-subtitle">System prompt</h3>
                  <p className="studio-workspace-text">
                    {selectedAgent.system_prompt || "No prompt set yet."}
                  </p>

                  <h3 className="studio-workspace-subtitle">
                    Attached tools (tool_refs)
                  </h3>
                  {selectedAgent.tool_refs.length === 0 ? (
                    <p className="studio-workspace-text">
                      No tools attached yet. Use StudioWorkspace to assign tools.
                    </p>
                  ) : (
                    <ul className="studio-workspace-text">
                      {selectedAgent.tool_refs.map((ref) => (
                        <li key={`${ref.kind}:${ref.id}`}>
                          {ref.kind} #{ref.id}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
              </>
            ) : (
              <p className="studio-workspace-text">
                Select an agent on the left to view its configuration.
              </p>
            )}
          </div>
        </main>

        {/* Right: placeholder for future tools/edges info */}
        <aside className="studio-workspace-column studio-workspace-right">
          <div className="studio-workspace-section">
            <h2 className="studio-workspace-title">Graph Overview</h2>
            <p className="studio-workspace-text">
              Nodes: {graph.nodes.length} <br />
              Edges: {graph.edges.length}
            </p>
            <p className="studio-workspace-text">
              In upcoming steps, this panel will show edges, routing logic, and
              a more visual graph representation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AssistantEditor;
