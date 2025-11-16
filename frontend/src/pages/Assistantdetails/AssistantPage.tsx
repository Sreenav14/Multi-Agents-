import React from "react";
import { useParams } from "react-router-dom";
import { useAssistant } from "../../hooks/useAssistant";
import AssistantHeader from "../../components/assistant/AssistantHeader";
import AgentList from "../../components/assistant/AgentList";
import type { AgentNodeProps } from "../../components/assistant/AgentNode";
import Playground from "../../components/assistant/Playground";


const AssistantPage: React.FC = () => {
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

  // Safely parse graph_json as we expect shape { nodes: [...] }
  const nodes = (assistant.graph_json as any)?.nodes ?? [];

  const agents: AgentNodeProps[] = nodes
    .filter((n: any) => n.type === "agent")
    .map((n: any) => ({
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
        height: "100%",
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

      {/* Right column: Playground */}
      <Playground
        assistantName={assistant.name}
        assistantId={assistant.id}
      />
      <div
        style={{
          borderRadius: 14,
          border: "1px solid rgba(148, 163, 184, 0.45)",
          padding: 16,
          boxSizing: "border-box",
          background:
            "radial-gradient(circle at top left, #020617, #020617)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "#e5e7eb" }}>
          Playground
        </div>
        <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
          Here you&apos;ll be able to chat with this assistant using the
          Planner → Researcher → Writer graph. We&apos;ll wire this up in the
          next step.
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;
