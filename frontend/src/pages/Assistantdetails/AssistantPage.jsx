import React from "react";
import { useParams } from "react-router-dom";
import { useAssistant } from "../../hooks/useAssistant.js";
import AssistantHeader from "../../components/assistant/AssistantHeader";
import AgentList from "../../components/assistant/AgentList";
import Playground from "../../components/assistant/Playground";

const AssistantPage = () => {
  const params = useParams();
  const id = params.assistantId ? Number(params.assistantId) : undefined;

  if (!id) {
    return <div>Invalid assistant id</div>;
  }

  const { assistant, loading, error } = useAssistant(id);

  if (loading) {
    return <div>Loading assistant...</div>;
  }

  if (error || !assistant) {
    return <div>Failed to load assistant: {error || "Unknown error"}</div>;
  }

  const nodes = assistant.graph_json?.nodes ?? [];

  const agents = nodes
    .filter((n) => n.type === "agent")
    .map((n) => ({
      id: n.id,
      role: n.role || n.id,
      systemPrompt: n.system_prompt,
    }));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr)",
        gap: 16,
        height: "100vh", // ✅ Full viewport height
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      {/* Left column: assistant info + agent graph */}
      <div>
        <AssistantHeader
          name={assistant.name}
          description={assistant.description}
          spec={assistant.spec}
        />
        <AgentList agents={agents} />
      </div>

      {/* Right column: Playground - Full size */}
      <Playground
        assistantName={assistant.name}
        assistantId={assistant.id}
      />
      {/* ✅ Removed duplicate div */}
    </div>
  );
};

export default AssistantPage;
