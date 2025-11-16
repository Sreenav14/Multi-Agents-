import React, { useState } from "react";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import AssistantGrid from "../../components/studio/AssistantGrid";
import NewAssistantForm from "../../components/studio/NewAssistantForm";
import { useAssistants } from "../../hooks/useAssistants";
import type { Assistant } from "../../types/api";
import type { AssistantCardProps } from "../../components/studio/AssistantCard";
import { useNavigate } from "react-router-dom";

const StudioDashboard: React.FC = () => {
  const { assistants, loading, error, refetch } = useAssistants();
  const navigate = useNavigate();
  const [showNewForm, setShowNewForm] = useState(false);

  const mappedAssistants: AssistantCardProps[] = assistants.map(
    (assistant: Assistant) => ({
      name: assistant.name,
      description: assistant.description,
      spec: assistant.spec,
      createdAt: new Date(assistant.created_at).toLocaleDateString(),
      onClick: () => navigate(`/assistants/${assistant.id}`),
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
        marginBottom: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h1 style={{ fontSize: "1.1rem" }}>Studio</h1>
      <Button onClick={handleNewAssistantClick}>
        {showNewForm ? "Close" : "New Assistant"}
      </Button>
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
