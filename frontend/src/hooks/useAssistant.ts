import {useState,useEffect,useCallback} from "react";
import type {Assistant} from "../types/api";
import {fetchAssistantById} from "../api/assistants";

export function useAssistant(id:number) {
    const [assistant, setAssistant] = useState<Assistant | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const load = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);
            const data = await fetchAssistantById(id);
            setAssistant(data);
        } catch (err: any) {
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
