import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "favoriteGroups";

export type FavoriteGroups = Record<string, number[]>;

export function useFavoriteGroups() {
  const [groups, setGroups] = useState<FavoriteGroups>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved) as Record<string, number[]>;
      const cleaned: FavoriteGroups = {};
      Object.entries(parsed).forEach(([name, ids]) => {
        if (Array.isArray(ids) && ids.length > 0) cleaned[name] = ids;
      });
      return cleaned;
    } catch {
      return {};
    }
  });

  const groupsCount = Object.keys(groups).length;

  const saveGroups = useCallback((newGroups: FavoriteGroups) => {
    const cleaned: FavoriteGroups = {};
    Object.entries(newGroups).forEach(([name, ids]) => {
      if (ids.length > 0) cleaned[name] = ids;
    });
    setGroups(cleaned);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new CustomEvent("groupsUpdated", { detail: cleaned }));
  }, []);

  useEffect(() => {
    const onGroupsUpdated = (e: CustomEvent) => {
      setGroups(e.detail ?? {});
    };
    window.addEventListener("groupsUpdated", onGroupsUpdated as EventListener);
    return () => window.removeEventListener("groupsUpdated", onGroupsUpdated as EventListener);
  }, []);

  return { groups, groupsCount, saveGroups };
}
