import { useEffect, useState, useCallback } from "react";
import { fetchAssistants } from "../api/assistants.js";

export function useAssistants() {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAssistants();
      setAssistants(data);
    } catch (err) {
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
