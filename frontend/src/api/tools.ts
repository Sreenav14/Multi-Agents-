import {apiClient} from "./client";
import type { UserToolConnection, MCPServer } from "../types/api";

// User tool connections

export async function fetchUserTools(): Promise<UserToolConnection[]>{
    const response = await apiClient.get<UserToolConnection[]>('/tools')
    return response.data
}

export interface CreateUserToolPayload{
    name: string;
    template_key: string;
    config_json?: Record<string, unknown> | null;
}

export async function createUserTool(payload: CreateUserToolPayload):
    Promise<UserToolConnection>{
    const response = await apiClient.post<UserToolConnection>('/tools', payload)
    return response.data
}

// MCP Servers

export async function fetchMCPServers() : Promise<MCPServer[]> {
    const response = await apiClient.get<MCPServer[]>('/mcp_servers')
    return response.data
}

export interface CreateMCPServerPayload{
    name: string;
    description?: string;
    server_type: "http" | "stdio" | "websocket";
    endpoint: string;
    config_json?: Record<string, unknown> | null;
}

export async function createMcpserver(payload: CreateMCPServerPayload): Promise<MCPServer>{
    const response = await apiClient.post<MCPServer>("/mcp_servers",{
        payload,
    });
    return response.data;
}
export async function deleteUserTool(id: number) {
    await apiClient.delete(`/tools/${id}`);
}
export async function deleteAllUserTools(){
    await apiClient.delete("/tools");
}