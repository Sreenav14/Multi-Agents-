import React from "react";
import Button from "../common/Button";
import "./ToolsPanel.module.css";

type ToolsPanelprops = {
    onAddTools: () => void;
 };

const ToolsPanel: React.FC<ToolsPanelprops> = ({ onAddTools}) => {
    return (
        <div className="tools-panel">
            <h3 className="tools-panel-title">Tools</h3>
            <Button onClick={onAddTools}>+ Add Tools</Button>
            <p className= "tools-panel-placeholder">
                Connected tools will appear here.
            </p>
        </div>
    );
};
export default ToolsPanel;