---
name: useFavoriteGroups hook
description: Centralizes favoriteGroups localStorage logic; all consumers must use it, not raw localStorage.
---

Hook lives at `client/src/hooks/useFavoriteGroups.ts`.

Exposes: `{ groups, groupsCount, saveGroups }`.

- `groups`: `{[groupName: string]: number[]}` — parsed from `localStorage.favoriteGroups`
- `groupsCount`: count of non-empty groups
- `saveGroups(newGroups)`: writes to localStorage + dispatches `groupsUpdated` CustomEvent
- Listens for `groupsUpdated` to keep all consumers in sync

**Why:** Previously Search.tsx, ProviderCard.tsx, and ComparisonModal.tsx each had their own localStorage read/write + event listener logic, causing stale reads and missed updates.

**How to apply:** Any component that reads or writes `favoriteGroups` from localStorage must import and use this hook instead of direct localStorage access.
