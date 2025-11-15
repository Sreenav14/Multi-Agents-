// frontend/src/pages/StudioDashboard.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAssistants, createAssistant } from "../api/assistants";

interface Assistant {
  id: number;
  name: string;
  description?: string | null;
  spec?: string | null;
  graph_json: any;
  created_at: string;
  updated_at: string;
}

const StudioDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [spec, setSpec] = useState("");

  // Load assistants on mount
  useEffect(() => {
    const loadAssistants = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAssistants();
        setAssistants(data);
      } catch (err: any) {
        setError("Failed to load assistants");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAssistants();
  }, []);

  const handleCreateAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        spec: spec.trim() || undefined,
      };

      const created = await createAssistant(payload);

      // Add to local list
      setAssistants((prev) => [created, ...prev]);

      // Reset form + close panel
      setName("");
      setDescription("");
      setSpec("");
      setIsCreating(false);

      // Navigate to the assistant builder / playground page
      navigate(`/assistants/${created.id}`);
    } catch (err: any) {
      setError("Failed to create assistant");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (assistantId: number) => {
    navigate(`/assistants/${assistantId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-indigo-500/80 flex items-center justify-center text-sm font-bold">
            MA
          </div>
          <div>
            <h1 className="text-lg font-semibold">Multi-Agents Studio</h1>
            <p className="text-xs text-slate-400">
              Create multi-agent assistants and test them in a playground.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="rounded-xl px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-400 transition disabled:opacity-60"
          disabled={loading}
        >
          + New Assistant
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 py-4">
        {error && (
          <div className="mb-3 rounded-lg border border-red-500/40 bg-red-900/20 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        {loading && assistants.length === 0 ? (
          <div className="mt-10 text-sm text-slate-400">Loading assistants…</div>
        ) : assistants.length === 0 ? (
          <div className="mt-10 text-sm text-slate-400">
            No assistants yet. Click{" "}
            <span className="font-semibold text-indigo-300">New Assistant</span>{" "}
            to create your first one.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
            {assistants.map((assistant) => (
              <button
                key={assistant.id}
                onClick={() => handleCardClick(assistant.id)}
                className="group text-left rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-indigo-500/60 transition p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold truncate">
                    {assistant.name}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 group-hover:bg-indigo-500/20 group-hover:text-indigo-200">
                    Agent graph
                  </span>
                </div>
                {assistant.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {assistant.description}
                  </p>
                )}
                {assistant.spec && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                    “{assistant.spec}”
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Slide-over create panel */}
      {isCreating && (
        <div className="fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/50"
            onClick={() => !loading && setIsCreating(false)}
          />

          {/* Panel */}
          <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold">New Assistant</h2>
                <p className="text-xs text-slate-400">
                  Define what this assistant should do. We’ll create a default
                  Planner → Researcher → Writer graph.
                </p>
              </div>
              <button
                onClick={() => !loading && setIsCreating(false)}
                className="text-slate-400 hover:text-slate-200 text-xl leading-none"
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAssistant} className="flex-1 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-300">Name</label>
                <input
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Trip Planner Agent"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-300">Description</label>
                <textarea
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-indigo-500 min-h-[60px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description for your studio dashboard."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-300">Spec / Instructions</label>
                <textarea
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-indigo-500 min-h-[80px]"
                  value={spec}
                  onChange={(e) => setSpec(e.target.value)}
                  placeholder="Describe what this assistant should do (e.g. 'Help me plan trips given a city and dates')."
                />
              </div>

              <div className="mt-auto flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => !loading && setIsCreating(false)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-900"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium disabled:opacity-60"
                  disabled={loading || !name.trim()}
                >
                  {loading ? "Creating…" : "Create Assistant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioDashboard;
