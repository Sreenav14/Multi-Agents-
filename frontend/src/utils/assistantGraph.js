/**
 * Returns a safe AssistantGraph from an Assistant,
 * even if graph_json is null/unknown/not-yet-initialized.
 */

export function getAssistantGraph(assistant) {
    const raw = assistant.graph_json;

    if( 
        raw && 
        typeof raw === "object" &&
        "nodes" in raw &&
        "edges" in raw
    ){
        return raw;
    }
    return {
        nodes: [],
        edges: [],
    }
}

/**
 * Helper to create a basic agent node.
 * Useful for future Agent Editor UI.
 */

export function createAgentNode(params) {
    return {
    id:params.id,
    label: params.label,
    role : undefined,
    system_prompt: params.system_prompt ?? "",
    tool_refs: [],
    }

}

/**
 * Helper to create a graph edge between two nodes.
 */

export function createGraphEdge(sourceId, targetId) {
    return {
        id : `${sourceId}->${targetId}`,
        source : sourceId,
        target : targetId,
        condition : undefined,
    };
}
