import React from "react";
import { useParams } from "react-router-dom";

const AssistantPage: React.FC = () => {
  const { assistantId } = useParams<{ assistantId: string }>();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Assistant {assistantId}</h1>
      <p className="text-slate-400">Assistant page coming soon...</p>
    </div>
  );
};

export default AssistantPage;

