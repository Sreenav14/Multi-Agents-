import React, { useState } from "react";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import AssistantGrid from "../../components/studio/AssistantGrid";
import NewAssistantForm from "../../components/studio/NewAssistantForm";
import { useAssistants } from "../../hooks/useAssistants.js";
import { useNavigate } from "react-router-dom";
import { deleteAssistant } from "../../api/assistants.js";

const StudioDashboard = () => {
  const { assistants, loading, error, refetch } = useAssistants();
  const navigate = useNavigate();
  const [showNewForm, setShowNewForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (assistantId) => {
    try {
      setDeletingId(assistantId);
      await deleteAssistant(assistantId);
      await refetch();
    } catch (err) {
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Failed to delete assistant";
      alert(`Failed to delete assistant: ${errorMessage}`);
    } finally {
      setDeletingId(null);
    }
  };

  const mappedAssistants = assistants.map(
    (assistant) => ({
      name: assistant.name,
      description: assistant.description,
      spec: assistant.spec,
      createdAt: new Date(assistant.created_at).toLocaleDateString(),
      onClick: () => navigate(`/assistants/${assistant.id}`),
      onDelete: deletingId === assistant.id ? undefined : () => handleDelete(assistant.id),
    })
  );

  const hasAssistants = mappedAssistants.length > 0;

  const handleNewAssistantClick = () => {
    setShowNewForm((prev) => !prev);
  };

  const handleAssistantCreated = async () => {
    // refresh list from backend and hide form
    await refetch();
    setShowNewForm(false);
  };

  // simple header – we can refactor into PageHeader component later
  const header = (
    <div
      style={{
        marginBottom: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        background: "linear-gradient(135deg, #E8DCC8 0%, #F5F1E8 100%)",
        borderRadius: "12px",
        border: "1px solid #D4C9B8",
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "#8B7A6B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dashboard</p>
        <h1 style={{ margin: 0, fontSize: "1.3rem", color: "#2C2416", fontWeight: 600 }}>Your Assistants</h1>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <Button onClick={handleNewAssistantClick}>
          {showNewForm ? "Close" : "+ New Assistant"}
        </Button>
        <Button onClick={() => navigate("/studio")}>Open Studio</Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        {header}
        <div>Loading assistants...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {header}
        <EmptyState
          title="Could not load assistants"
          description={error}
          action={
            <Button onClick={refetch}>
              Retry
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      {header}

      {showNewForm && (
        <div style={{ marginBottom: 16 }}>
          <NewAssistantForm onCreated={handleAssistantCreated} onCancel={() => setShowNewForm(false)} />
        </div>
      )}

      {hasAssistants ? (
        <AssistantGrid assistants={mappedAssistants} />
      ) : !showNewForm ? (
        <EmptyState
          title="No assistants yet"
          description="Create your first Rowboat-style assistant to start building multi-agent workflows."
          action={
            <Button onClick={handleNewAssistantClick}>Create Assistant</Button>
          }
        />
      ) : null}
    </>
  );
};



export default StudioDashboard;
