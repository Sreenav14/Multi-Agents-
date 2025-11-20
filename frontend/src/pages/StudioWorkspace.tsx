import React, {useState} from 'react';
import "./StudioWorkspace.module.css";
import AddToolsModal from "../components/studio/AddToolsModal";
import ToolsPanel from "../components/studio/ToolsPanel";

const StudioWorkspace: React.FC = () => {
  const [showAddToolsModal, setShowAddToolsModal] = useState(false);

  return (
    <>
      <div className="studio-workspace-root">
        {/* Left: Agents / Tools / Data / Variables */}
        <aside className="studio-workspace-column studio-workspace-left">
          <ToolsPanel onAddTools={() => setShowAddToolsModal(true)} />
          <div className="studio-workspace-section">
            <h2 className="studio-workspace-title">Agents</h2>
            <p className="studio-workspace-text">
              Configure agents roles, prompts and routing here.
            </p>
          </div>
          <div className="studio-workspace-section">
            <p className="studio-workspace-text">
              Connected tools and MCP will appear here.
            </p>
          </div>
          <div className="studio-workspace-section">
            <h2 className="studio-workspace-title">Data</h2>
            <p className="studio-workspace-text">
              Link docs, knowledge bases or datasets your agents can use.
            </p>
          </div>
          <div className="studio-workspace-section">
            <h2 className="studio-workspace-title">Variables</h2>
            <p className="studio-workspace-text">
              Define runtime variables (API Keys, Environment Flags, etc)
            </p>
          </div>
        </aside>
        {/* Center: Chat */}
        <main className="studio-workspace-column studio-workspace-center">
          <div className="studio-workspace-section studio-workspace-chat">
            <h2 className="studio-workspace-title">Studio Chat</h2>
            <div className="studio-workspace-chat-window">
              <p className="studio-workspace-text">
                This will be the MCP - enabled chat area where your agents run
                with tools. For now, it &apos;s just a placeholder.
              </p>
            </div>
            <div className="studio-workspace-chat-input-row">
              <input
                className="studio-workspace-chat-input"
                placeholder="Ask your assistant or describe a workflow..."
              />
              <button className="studio-workspace-primary-button">
                Run Workflow
              </button>
            </div>
          </div>
        </main>

        {/* Right: Helper */}
        <aside className="studio-workspace-column studio-workspace-right">
          <div className="studio-workspace-section">
            <h2 className="studio-workspace-title">Helper</h2>
            <p className="studio-workspace-text">
              This panel can show logs, guidance or a skipper-style helper as
              you build and run workflows.
            </p>
          </div>
        </aside>
      </div>

      {showAddToolsModal && (
        <AddToolsModal onclose={() => setShowAddToolsModal(false)} />
      )}
    </>
  );
};
export default StudioWorkspace;