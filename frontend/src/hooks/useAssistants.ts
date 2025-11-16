import { useEffect, useState, useCallback } from "react";
import type { Assistant } from "../types/api";
import { fetchAssistants } from "../api/assistants";

export function useAssistants() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAssistants();
      setAssistants(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load assistants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    assistants,
    loading,
    error,
    refetch: load, // 
  };
}
