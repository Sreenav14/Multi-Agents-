import {useState,useEffect,useCallback} from "react";
import {fetchAssistantById} from "../api/assistants.js";

export function useAssistant(id) {
    const [assistant, setAssistant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const load = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);
            const data = await fetchAssistantById(id);
            setAssistant(data);
        } catch (err) {
            setError(err?.message || "Failed to load assistant");
        } finally {
            setLoading(false);
        }
    }, [id]);
    
    useEffect(() => {
        load();
    }, [load]);

    return {
        assistant,
        loading,
        error,
        refetch: load,
    };
}
