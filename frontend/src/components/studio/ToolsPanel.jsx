import React, { useState } from "react";
import Button from "../common/Button";
import "./ToolsPanel.module.css";
import {connectGmailTool} from "../../api/tools.js";

const ToolsPanel = ({onAddTools, onDeleteTool, onDeleteMcpServer, tools, mcpServers, loading, error }) => {

    const [gmailError, setGmailError] = useState(null);
    const [isConnectingGmail, setIsConnectingGmail] = useState(false);

    const handleConnectGmail = async() => {
        try {
            setGmailError(null);
            setIsConnectingGmail(true);

            // Asks backend to create a new Gmail tool + get auth_url
            const data = await connectGmailTool();

            // redirect user to auth_url page
            if (data.auth_url){
                window.location.href = data.auth_url;
            } else {
                setGmailError("Failed to connect Gmail. Please try again.");
                setIsConnectingGmail(false);
            }
        }
        catch (err) {
            console.error("Error connecting Gmail:", err);
            setGmailError("Failed to connect Gmail. Please try again.");
            setIsConnectingGmail(false);
        }
    };

    return (
        <div className="tools-panel">
        <div className="tools-panel-header-row">
            <h3 className="tools-panel-title">Tools</h3>
            <Button onClick={onAddTools}>+ Add Tools</Button>
            <Button onClick={handleConnectGmail} disabled={isConnectingGmail}>
                {isConnectingGmail ? "Connecting..." : "Connect Gmail"}
            </Button>
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
                                            <div className="tools-panel-item-actions">
                                                <span className = "tools-panel-item-status">
                                                    {tool.status}
                                                </span>
                                                {onDeleteTool && (
                                                    <button
                                                        className="tools-panel-delete-btn"
                                                        onClick={() => onDeleteTool(tool.id)}
                                                        title="Delete tool"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
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
                                    <div className="tools-panel-item-actions">
                                        <span className = "tools-panel-item-sub">
                                            {server.server_type}
                                        </span>
                                        {onDeleteMcpServer && (
                                            <button
                                                className="tools-panel-delete-btn"
                                                onClick={() => onDeleteMcpServer(server.id)}
                                                title="Delete MCP server"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
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
