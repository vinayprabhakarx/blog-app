import { useState, useEffect, useCallback } from "react";
import api from "@/api/api";

export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!url) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Extract the endpoint from the full URL
      const endpoint = url.replace(api.defaults.baseURL, "");

      // Use the appropriate HTTP method
      const method = options.method?.toLowerCase() || "get";
      let response;

      if (method === "get") {
        response = await api.get(endpoint, options);
      } else if (method === "post") {
        response = await api.post(endpoint, options.body, options);
      } else if (method === "put") {
        response = await api.put(endpoint, options.body, options);
      } else if (method === "delete") {
        response = await api.delete(endpoint, options);
      } else {
        response = await api.get(endpoint, options);
      }

      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error };
};
