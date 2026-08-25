import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Provider } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const STORAGE_KEY = "favoriteGroups";
const activeGuestMigrations = new Set<string>();
const completedGuestMigrations = new Set<string>();

export type FavoriteGroups = Record<string, number[]>;

export interface SavedFavoriteGroup {
  id: string;
  name: string;
  providerIds: number[];
  providers: Provider[];
  createdAt: string | Date;
  updatedAt: string | Date;
}
interface SavedFavoriteGroupsResponse {
  revision: number;
  groups: SavedFavoriteGroup[];
}

function normalizeGroups(value: unknown): FavoriteGroups {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const cleaned: FavoriteGroups = {};
  Object.entries(value as Record<string, unknown>).forEach(([rawName, rawIds]) => {
    const name = rawName.trim();
    if (!name || !Array.isArray(rawIds)) return;
    const providerIds = Array.from(new Set(rawIds.filter(
      (id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0,
    )));
    if (providerIds.length > 0) cleaned[name] = providerIds;
  });
  return cleaned;
}

function readGuestGroups(): FavoriteGroups {
  try {
    return normalizeGroups(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
  } catch {
    return {};
  }
}

function writeGuestGroups(groups: FavoriteGroups) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  window.dispatchEvent(new CustomEvent("groupsUpdated", { detail: groups }));
}

function groupsToPayload(groups: FavoriteGroups) {
  return Object.entries(groups).map(([name, providerIds]) => ({ name, providerIds }));
}

function groupsToMap(records: SavedFavoriteGroup[] | undefined): FavoriteGroups {
  const groups: FavoriteGroups = {};
  records?.forEach((group) => {
    const ids = Array.from(new Set(group.providerIds));
    if (ids.length > 0) groups[group.name] = ids;
  });
  return groups;
}

function optimisticRecords(
  groups: FavoriteGroups,
  previous: SavedFavoriteGroup[] | undefined,
): SavedFavoriteGroup[] {
  const byName = new Map(previous?.map((group) => [group.name, group]));
  const now = new Date().toISOString();
  return Object.entries(groups).map(([name, providerIds]) => {
    const existing = byName.get(name);
    return {
      id: existing?.id ?? `saving-${name}`,
      name,
      providerIds,
      providers: existing?.providers.filter((provider) => providerIds.includes(provider.id)) ?? [],
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
  });
}

function rebaseGroups(base: FavoriteGroups, desired: FavoriteGroups, latest: FavoriteGroups): FavoriteGroups {
  const rebased: FavoriteGroups = { ...latest };
  Object.keys(base).forEach((name) => {
    if (!desired[name]) delete rebased[name];
  });
  Object.entries(desired).forEach(([name, desiredIds]) => {
    const baseIds = base[name] ?? [];
    const latestIds = rebased[name] ?? [];
    const added = desiredIds.filter((id) => !baseIds.includes(id));
    const removed = baseIds.filter((id) => !desiredIds.includes(id));
    rebased[name] = latestIds.filter((id) => !removed.includes(id));
    added.forEach((id) => {
      if (!rebased[name].includes(id)) rebased[name].push(id);
    });
    if (!base[name]) rebased[name] = Array.from(new Set([...latestIds, ...desiredIds]));
  });
  return normalizeGroups(rebased);
}

/**
 * Keeps named favorite/comparison groups server-backed for signed-in parents,
 * while retaining a recoverable local fallback for guests.
 */
export function useFavoriteGroups() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ["/api/favorite-groups", user?.id] as const;
  const [guestGroups, setGuestGroups] = useState<FavoriteGroups>(readGuestGroups);
  const migrationAttemptedFor = useRef<string | null>(null);

  const savedGroupsQuery = useQuery<SavedFavoriteGroupsResponse>({
    queryKey,
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/favorite-groups");
      return await response.json() as SavedFavoriteGroupsResponse;
    },
  });

  useEffect(() => {
    const onGroupsUpdated = (event: CustomEvent<FavoriteGroups>) => {
      if (!isAuthenticated) setGuestGroups(normalizeGroups(event.detail));
    };
    window.addEventListener("groupsUpdated", onGroupsUpdated as EventListener);
    return () => window.removeEventListener("groupsUpdated", onGroupsUpdated as EventListener);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) return;
    setGuestGroups(readGuestGroups());
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || savedGroupsQuery.isLoading) return;
    if (
      migrationAttemptedFor.current === user.id ||
      activeGuestMigrations.has(user.id) ||
      completedGuestMigrations.has(user.id)
    ) return;

    const guestGroupsToMigrate = readGuestGroups();
    migrationAttemptedFor.current = user.id;
    if (Object.keys(guestGroupsToMigrate).length === 0) return;

    activeGuestMigrations.add(user.id);
    void (async () => {
      try {
        const response = await apiRequest("POST", "/api/favorite-groups/import", {
          groups: groupsToPayload(guestGroupsToMigrate),
        });
        const savedGroups = await response.json() as SavedFavoriteGroupsResponse;
        queryClient.setQueryData(queryKey, savedGroups);
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent("groupsUpdated", { detail: {} }));
        completedGuestMigrations.add(user.id);
        toast({
          title: "Saved groups restored",
          description: "Your groups from this device are now available in your account.",
        });
      } catch {
        migrationAttemptedFor.current = null;
        toast({
          title: "Groups still saved on this device",
          description: "We could not add your local groups to your account. They have not been removed; please try again later.",
          variant: "destructive",
        });
      } finally {
        activeGuestMigrations.delete(user.id);
      }
    })();
  }, [isAuthenticated, user?.id, savedGroupsQuery.isLoading, queryClient, toast]);

  const groups = useMemo(
    () => (isAuthenticated ? groupsToMap(savedGroupsQuery.data?.groups) : guestGroups),
    [isAuthenticated, savedGroupsQuery.data, guestGroups],
  );

  const saveGroups = useCallback(async (nextGroups: FavoriteGroups): Promise<boolean> => {
    const cleaned = normalizeGroups(nextGroups);
    if (!isAuthenticated) {
      setGuestGroups(cleaned);
      writeGuestGroups(cleaned);
      return true;
    }

    const previous = queryClient.getQueryData<SavedFavoriteGroupsResponse>(queryKey);
    let state: SavedFavoriteGroupsResponse = previous ?? await queryClient.fetchQuery({
      queryKey,
      queryFn: async () => (await apiRequest("GET", "/api/favorite-groups")).json() as Promise<SavedFavoriteGroupsResponse>,
    });
    let intended = rebaseGroups(groups, cleaned, groupsToMap(state.groups));
    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await apiRequest("PUT", "/api/favorite-groups", {
            groups: groupsToPayload(intended),
            revision: state.revision,
          });
          queryClient.setQueryData(queryKey, await response.json() as SavedFavoriteGroupsResponse);
          return true;
        } catch (error) {
          if (!String(error).startsWith("Error: 409:") || attempt === 1) throw error;
          state = await queryClient.fetchQuery({
            queryKey,
            queryFn: async () => (await apiRequest("GET", "/api/favorite-groups")).json() as Promise<SavedFavoriteGroupsResponse>,
          });
          intended = rebaseGroups(groups, cleaned, groupsToMap(state.groups));
        }
      }
      return false;
    } catch {
      queryClient.setQueryData(queryKey, previous);
      toast({
        title: "Could not save your group changes",
        description: "Your saved groups have not changed. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [isAuthenticated, queryClient, queryKey, toast, groups]);

  return {
    groups,
    groupRecords: savedGroupsQuery.data?.groups ?? [],
    groupsCount: Object.keys(groups).length,
    isLoadingGroups: isAuthenticated && savedGroupsQuery.isLoading,
    saveGroups,
  };
}