import {useCallback,useEffect,useState} from "react";
import type {UserToolConnection, MCPServer} from "../types/api";
import {fetchUserTools,fetchMCPServers} from "../api/tools";

export function useTools(){
    const [userTools, setUserTools] = useState<UserToolConnection[]>([]);
    const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async ()=> {
        try {
            setLoading(true);
            setError(null);

            const [tools, servers] = await Promise.all([fetchUserTools(), fetchMCPServers()]);
            setUserTools(tools);
            setMcpServers(servers);
        }
        catch (err : any) {
            const message = err?.response?.data?.detail || err?.response?.data?.message ||
            err?.message || "Failed to load tools/servers"
            setError(message);
        }finally {
            setLoading(false);
        } }, []);

        useEffect (() =>{
            load();
        }, [load]);

        return {userTools, mcpServers, loading, error};
    

}