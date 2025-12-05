import {apiClient} from "./client.js";

// User tool connections

export async function fetchUserTools(){
    const response = await apiClient.get('/tools')
    return response.data
}

export async function createUserTool(payload){
    const response = await apiClient.post('/tools', payload)
    return response.data
}

export async function deleteUserTool(id) {
    await apiClient.delete(`/tools/${id}`);
}

export async function deleteAllUserTools(){
    await apiClient.delete("/tools");
}

// MCP Servers

export async function fetchMCPServers() {
    const response = await apiClient.get('/mcp_servers')
    return response.data
}

export async function createMcpserver(payload){
    const response = await apiClient.post("/mcp_servers",payload);
    return response.data;
}

export async function deleteMCPServer(id) {
    await apiClient.delete(`/mcp_servers/${id}`);
}

// Adding Gmail connector

export async function connectGmailTool(name){
    const response = await apiClient.post('/tools/gmail/connect', { name });
    return response.data;
}

export async function verifyGmailTool(toolId){
    const response = await apiClient.post(`/tools/gmail/verify/${toolId}`);
    return response.data;
}
