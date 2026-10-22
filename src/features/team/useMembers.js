import { useCallback, useEffect, useRef, useState } from "react";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { ROLE_FILTER_ALL, TEAM_PAGE_SIZE } from "@/constants/team";
import { api } from "@/lib/api";

const EMPTY_DATA = {
  members: [],
  pagination: { page: 1, limit: TEAM_PAGE_SIZE, total: 0, totalPages: 1 },
};

// Loads one page of members for the given filters and exposes add / update / remove.
export function useMembers({ search, role, page }) {
  const [data, setData] = useState(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const silentReload = useRef(false); // after add/edit/remove, keep rows on screen while refetching

  useEffect(() => {
    const controller = new AbortController();
    if (!silentReload.current) setIsLoading(true);
    silentReload.current = false;
    setError(null);

    api(API_ENDPOINTS.TEAM, {
      params: { search, role: role === ROLE_FILTER_ALL ? undefined : role, page, limit: TEAM_PAGE_SIZE },
      signal: controller.signal,
    })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [search, role, page, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  const refresh = useCallback(() => {
    silentReload.current = true;
    reload();
  }, [reload]);

  // These throw ApiError on failure so the calling form can show it.
  const addMember = useCallback(
    async ({ name, email, role: memberRole, password }) => {
      await api(API_ENDPOINTS.TEAM, {
        method: HTTP_METHODS.POST,
        body: { name, email, role: memberRole, password },
      });
      refresh();
    },
    [refresh],
  );

  const updateMember = useCallback(
    async (id, changes) => {
      await api(API_ENDPOINTS.teamMember(id), { method: HTTP_METHODS.PATCH, body: changes });
      refresh();
    },
    [refresh],
  );

  const removeMember = useCallback(
    async (id) => {
      await api(API_ENDPOINTS.teamMember(id), { method: HTTP_METHODS.DELETE });
      refresh();
    },
    [refresh],
  );

  return { ...data, isLoading, error, reload, addMember, updateMember, removeMember };
}
