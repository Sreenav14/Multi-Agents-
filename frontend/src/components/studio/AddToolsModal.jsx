import React, { useState } from "react";
import styles from "./AddToolsModal.module.css";
import Button from "../common/Button";
import { createUserTool, createMcpserver, connectGmailTool} from "../../api/tools.js";

const LIBRARY_TOOLS=[
    {
        key: "tavily",
        name: "Tavily Search",
        description: "Web search + news retrival",
        category: "search",
    },
    {
        key: "gmail",
        name: "Gmail Toolkit",
        description: "Read and send emails from your agents",
        category: "email",
    },
    {
        key: "Github",
        name: "Github Toolkit",
        description: "Inspect repos, issues and pull requests.",
        category: "code",
    },
    {
        key: "weather",
        name: "Weather Toolkit",
        description: "Get weather updates for any location",
        category: "weather",
    },{
        key:"google-sheets",
        name:"Google Sheets Toolkit",
        description:"Read, write and analyze data in Google Sheets",
        category:"Data",
}];

const AddToolsModal = ({onclose}) => {
    const [activeTab, setActiveTab] = useState("library");

    const [mcpName, setMcpName] = useState("");
    const [mcpEndpoint, setMcpEndpoint] = useState("");
    const [mcpType, setMcpType] = useState("http");

    const [isConnectingTool, setIsConnectingTool] = useState(false);
    const [isSavingMcp, setIsSavingMcp] = useState(false);

    const handleConnect = async (tool) => {

        // Special handling for Gmail - Directly initiate OAuth login
        if(tool.key === "gmail"){
            try{
                setIsConnectingTool(true);
                
                // Ask for connection name
                const defaultName = `${tool.name}`;
                const name = window.prompt("Connection name", defaultName);
                if (!name){
                    setIsConnectingTool(false);
                    return;
                }
                
                // Initiate Gmail OAuth flow (uses backend's configured credentials)
                const data = await connectGmailTool(name);

                if(data.auth_url){
                    // Redirect user to Google login
                    window.location.href = data.auth_url;
                } else {
                    alert("Failed to connect Gmail. Please try again.");
                    setIsConnectingTool(false);
                }
            }
            catch (error){
                console.error("Failed to connect Gmail", error);
                setIsConnectingTool(false);
                const errorMsg = error?.response?.data?.detail || error?.message || "Failed to connect Gmail. Please try again.";
                alert(errorMsg);
            }
            return;
        }


        // for all other tools, use API Key based connection
        const defaultName = `${tool.name}`;
        const name = window.prompt("Connection name", defaultName);
        if (!name){
            return;
        }
        const apiKey = window.prompt(
            `Enter API key for ${tool.name}`,"");
        if (!apiKey){
            return;
        }
        try{
            setIsConnectingTool(true);
            await createUserTool({
                name,
                template_key: tool.key,
                config_json: {
                    api_key: apiKey,
                },

            });
            alert (`Connected ${tool.name} successfully!`);
        }
        catch (error){
            console.error("Failed to connect tool", error);
            // Extract error message from various possible error formats
            let message = "Failed to connect tool";
            if (error?.response?.data?.detail) {
                message = typeof error.response.data.detail === 'string' 
                    ? error.response.data.detail 
                    : JSON.stringify(error.response.data.detail);
            } else if (error?.response?.data?.message) {
                message = error.response.data.message;
            } else if (error?.message) {
                message = error.message;
            }
            console.error("Full error details:", error);
            alert(message);
        }
        finally{
            setIsConnectingTool(false);
        }
    };


    
    // handler for mcp server creation
    const handleCreateMcpServer = async () =>{
        if (!mcpName || !mcpEndpoint) {
            alert("Please enter both a name and an endpoint URL for the MCP server.");
            return;
        }
        try{
            setIsSavingMcp(true);
            // Normalize server_type: "websockets" -> "websocket"
            const normalizedServerType = mcpType === "websockets" ? "websocket" : mcpType;
            await createMcpserver({
                name: mcpName,
                description: "",
                server_type: normalizedServerType,
                endpoint: mcpEndpoint,
                config_json: null,
            });
            alert(`MCP Server "${mcpName}" saved`);

            // Reset fields
            setMcpName("");
            setMcpEndpoint("");
            setMcpType("http");
        }
        catch (error){
            console.error("Failed to create MCP Server", error);
            const message = error.response?.data?.detail || "Failed to create MCP Server";
            alert(message);
        }
        finally{
            setIsSavingMcp(false);
        }

        
    };

    return (
        <div className={styles["add-tools-modal-overlay"]}>
            <div className={styles["add-tools-modal"]}>
                {/* Header row */}
                <div className={styles["add-tools-header"]}>
                    <h2 className={styles["add-tools-title"]}>Add Tools</h2>
                    <button
                        className={styles["add-tools-close-icon"]}
                        onClick={onclose}
                    >
                        X
                    </button>
                </div>

                {/* Tabs */}
                <div className={styles["add-tools-tabs"]}>
                    <button
                        className={
                            activeTab === "library"
                                ? `${styles["add-tools-tab"]} ${styles["add-tools-tab-active"]}`
                                : styles["add-tools-tab"]
                        }
                        onClick={() => setActiveTab("library")}
                    >
                        Library
                    </button>
                    <button
                        className={
                            activeTab === "mcp"
                                ? `${styles["add-tools-tab"]} ${styles["add-tools-tab-active"]}`
                                : styles["add-tools-tab"]
                        }
                        onClick={() => setActiveTab("mcp")}
                    >
                        Custom MCP Servers
                    </button>
                </div>

                {/* Tab Content */}
                <div className={styles["add-tools-body"]}>
                    {activeTab === "library" ? (
                        <div className={styles["add-tools-library"]}>
                            <p className={styles["add-tools-subtitle"]}>
                                Pick a pre-built toolkit and connect it with your key.
                            </p>
                            <div className={styles["add-tools-grid"]}>
                                {LIBRARY_TOOLS.map((tool) => (
                                    <div
                                        key={tool.key}
                                        className={styles["add-tools-card"]}
                                    >
                                        <div className={styles["add-tools-card-header"]}>
                                            <div className={styles["add-tools-card-name"]}>
                                                {tool.name}
                                            </div>
                                            <span className={styles["add-tools-card-chip"]}>
                                                {tool.category}
                                            </span>
                                        </div>
                                        <p className={styles["add-tools-card-description"]}>
                                            {tool.description}
                                        </p>
                                        <Button onClick={() => handleConnect(tool)}>
                                            Connect
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {activeTab === "mcp" ? (
                        <div className={styles["add-tools-mcp"]}>
                            <p className={styles["add-tools-subtitle"]}>
                                register custom MCP server that expose tools to your agents.
                            </p>

                            {/* Existing server placeholder */}
                            <div className={styles["add-tools-mcp-placeholder"]}>
                                <p>
                                    In the next phase, you will be able to connect to custom MCP
                                    servers.
                                </p>
                                <ul>
                                    <li>Filesystem MCP (local files)</li>
                                    <li>HTTP MCP (REST API)</li>
                                    <li>Monitoring metrics</li>
                                </ul>
                            </div>

                            {/* MCP Connection Form */}
                            <div className={styles["add-tools-mcp-form"]}>
                                <div className={styles["add-tools-mcp-field"]}>
                                    <label className={styles["add-tools-mcp-label"]}>
                                        Name
                                    </label>
                                    <input
                                        className={styles["add-tools-mcp-input"]}
                                        placeholder="eg filesystem-mcp"
                                        value={mcpName}
                                        onChange={(e) => setMcpName(e.target.value)}
                                    />
                                </div>
                                <div className={styles["add-tools-mcp-field"]}>
                                    <label className={styles["add-tools-mcp-label"]}>
                                        Endpoint
                                    </label>
                                    <input
                                        className={styles["add-tools-mcp-input"]}
                                        placeholder="eg https://localhost:8000/mcp"
                                        value={mcpEndpoint}
                                        onChange={(e) => setMcpEndpoint(e.target.value)}
                                    />
                                </div>
                                <div className={styles["add-tools-mcp-field"]}>
                                    <label className={styles["add-tools-mcp-label"]}>
                                        Connection Type
                                    </label>
                                    <select
                                        className={styles["add-tools-mcp-input"]}
                                        value={mcpType}
                                        onChange={(e) =>
                                            setMcpType(e.target.value)
                                        }
                                    >
                                        <option value="http">HTTP</option>
                                        <option value="stdio">stdio</option>
                                        <option value="websockets">Websockets</option>
                                    </select>
                                </div>
                                <div className={styles["add-tools-mcp-actions"]}>
                                    <Button onClick={handleCreateMcpServer}>
                                        Save MCP Server
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className={styles["add-tools-footer"]}>
                    <Button onClick={onclose}>Done</Button>
                </div>
            </div>
        </div>
    );
};

export default AddToolsModal;
