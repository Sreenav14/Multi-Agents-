import React from "react";
import Button from "../common/Button";
import "./ToolsPanel.module.css";
import type {UserToolConnection, MCPServer} from "../../types/api";

type ToolsPanelprops = {
    onAddTools: () => void;
    tools: UserToolConnection[];
    mcpServers: MCPServer[];
    loading: boolean;
    error: string | null;
 };

const ToolsPanel: React.FC<ToolsPanelprops> = ({onAddTools, tools, mcpServers, loading, error }) => {
    return (
        <div className="tools-panel">
        <div className="tools-panel-header-row">
            <h3 className="tools-panel-title">Tools</h3>
            <Button onClick={onAddTools}>+ Add Tools</Button>
        </div>
            {loading && (
                <p className = "tools-panel-loading">Loading Tools...</p>
            )}
            {error && !loading &&(
                <p className = "tools-panel-error">Failed to load tools:</p>
            )}
            {!loading && !error && tools.length === 0 && mcpServers.length === 0 && (
                <p className = "tools-panel-placeholder">
                    No tools or MCP servers connected yet.
                </p>
            ) }
            {!loading && !error && (tools.length > 0 || mcpServers.length > 0) && (
                <div className = "tools-panel-lists">
                    {tools.length > 0 && (
                        <div className = "tools-panel-section">
                            <div className = "tools-panel-section-header">
                                <span className = "tools-panel-section-title">
                                    Library Tools
                                </span>
                                <span className = "tools-panel-section-count">
                                    {tools.length}
                                </span>
                                <ul className = "tools-panel-list">
                                    {tools.map((tool)=>(
                                        <li key = {tool.id} className = "tools-panel-item">
                                            <div className = "tools-panel-item-main">
                                                <span className = "tools-panel-item-name">
                                                    {tool.template_key}
                                                </span>
                                            </div>
                                            <span className = "tools-panel-item-status">
                                                {tool.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {mcpServers.length > 0 && (
                        <div className = "tools-panel-section">
                            <div className = "tools-panel-section-header">
                                <span className = "tools-panel-section-title">
                                    MCP Servers
                                </span>
                                <span className = "tools-panel-section-count">
                                    {mcpServers.length}
                                </span>
                            </div>
                            <ul className = "tools-panel-list">
                                {mcpServers.map((server)=>
                                <li key = {server.id} className = "tools-panel-item">
                                    <div className = "tools-panel-item-main">
                                        <span className = "tools-panel-item-name">
                                            {server.name}</span>
                                            <span className = "tools-panel-item-tag">
                                                {server.server_type}
                                            </span>
                                    </div>
                                    <span className = "tools-panel-item-sub">
                                        {server.server_type}
                                    </span>
                                </li>
                                )}

                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>

    );
};
export default ToolsPanel;