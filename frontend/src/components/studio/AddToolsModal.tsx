import React, { useState } from "react";
import styles from "./AddToolsModal.module.css";
import Button from "../common/Button";

type AddToolsModalProps = {
    onclose:()=> void;
};

type TabKey = "library" | "mcp" | "connection";

type LibraryTool = {
    key: string;
    name: string;
    description: string;
    category: string;
};

const LIBRARY_TOOLS: LibraryTool[]=[
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

const AddToolsModal: React.FC<AddToolsModalProps> = ({onclose}) => {
    const [activeTab, setActiveTab] = useState<TabKey>("library");

    const [mcpName, setMcpName] = useState("");
    const [mcpEndpoint, setMcpEndpoint] = useState("");
    const [mcpType, setMcpType] = useState<"stdio" | "http" | "websockets">(
        "http"
    );

    const handleConnect = (toolkey: string) => {
    // For now just a placeholder. Later this will open a form
    // and call POST /tools with API key, etc.
    alert(`Connect flor for "${toolkey}" will be  implemented in the next phase. `);
    };

    // handler for mcp server creation
    const handleCreateMcpServer = () =>{
        if (!mcpName || !mcpEndpoint) {
            alert("Please enter both a name and an endpoint URL for the MCP server.");
            return;
        }
        console.log("Create MCP Server",{
            name:mcpName,
            endpoint: mcpEndpoint,
            type: mcpType,
        });
        alert(
            `MCP server "${mcpName} (${mcpType}) pointing to ${mcpEndpoint}" would be created here.` 
        );
        setMcpName("");
        setMcpEndpoint("");
        setMcpType("http");
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
                                        <Button onClick={() => handleConnect(tool.key)}>
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
                                        Connection Type
                                    </label>
                                    <select
                                        className={styles["add-tools-mcp-input"]}
                                        value={mcpType}
                                        onChange={(e) =>
                                            setMcpType(
                                                e.target.value as
                                                    | "stdio"
                                                    | "http"
                                                    | "websockets"
                                            )
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