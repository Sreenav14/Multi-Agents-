import {useCallback,useEffect,useState} from "react";
import {fetchUserTools,fetchMCPServers} from "../api/tools.js";

export function useTools(){
    const [userTools, setUserTools] = useState([]);
    const [mcpServers, setMcpServers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async ()=> {
        try {
            setLoading(true);
            setError(null);

            const [tools, servers] = await Promise.all([fetchUserTools(), fetchMCPServers()]);
            setUserTools(tools);
            setMcpServers(servers);
        }
        catch (err) {
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
