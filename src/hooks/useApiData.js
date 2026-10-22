import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

// GETs `path` with `params` through the shared API client.
// `data` stays on screen while a refetch is running, so widgets can dim instead of flashing a skeleton.
export function useApiData(path, params) {
  const [state, setState] = useState({ data: null, error: null, isLoading: true });
  const [reloadKey, setReloadKey] = useState(0);
  const paramsKey = JSON.stringify(params ?? {}); // stable dependency for inline params objects

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, error: null, isLoading: true }));

    api(path, { params: JSON.parse(paramsKey), signal: controller.signal })
      .then((data) => setState({ data, error: null, isLoading: false }))
      .catch((error) => {
        if (error.name !== "AbortError") setState((current) => ({ ...current, error, isLoading: false }));
      });

    return () => controller.abort();
  }, [path, paramsKey, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  return { ...state, reload };
}
