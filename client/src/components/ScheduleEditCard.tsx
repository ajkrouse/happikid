import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Pencil, X, Save, AlertCircle, Plus, Trash2, CalendarX, RefreshCw } from "lucide-react";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DayKey = (typeof DAYS)[number];

interface DaySchedule {
  isOpen: boolean;
  open: string;
  close: string;
}

type ScheduleMap = Record<DayKey, DaySchedule>;

export interface ClosedDateEntry {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  reason?: string;
}

interface ScheduleEditCardProps {
  provider: {
    id: number;
    schedule?: Record<string, { isOpen?: boolean; open?: string; close?: string }> | null;
    closureNote?: string | null;
    closedDates?: ClosedDateEntry[] | null;
  };
}

function buildInitialSchedule(
  raw: ScheduleEditCardProps["provider"]["schedule"]
): ScheduleMap {
  const defaults: DaySchedule = { isOpen: false, open: "07:00", close: "18:00" };
  const result = {} as ScheduleMap;
  for (const day of DAYS) {
    const existing = raw?.[day];
    result[day] = {
      isOpen: existing?.isOpen ?? false,
      open: existing?.open || defaults.open,
      close: existing?.close || defaults.close,
    };
  }
  return result;
}

function formatTime(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "pm" : "am";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m}${suffix}`;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Today's date as YYYY-MM-DD in local time */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Snapshot of the server's provider data taken when the user enters edit mode. */
interface ProviderSnapshot {
  schedule: ScheduleEditCardProps["provider"]["schedule"];
  closureNote: string | null | undefined;
  closedDates: ClosedDateEntry[] | null | undefined;
}

export function ScheduleEditCard({ provider }: ScheduleEditCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleMap>(() =>
    buildInitialSchedule(provider.schedule)
  );
  const [closureNote, setClosureNote] = useState(provider.closureNote ?? "");
  // Mirrors the last successfully saved closure note so the amber banner
  // appears immediately after save without waiting for React Query to
  // deliver a fresh provider prop.
  const [savedClosureNote, setSavedClosureNote] = useState(provider.closureNote ?? "");
  // Mirrors the last successfully saved closedDates so the read-only list
  // reflects the save immediately, before React Query delivers the fresh prop.
  const [savedClosedDates, setSavedClosedDates] = useState<ClosedDateEntry[]>(
    () => (provider.closedDates ?? [])
  );
  const [closedDates, setClosedDates] = useState<ClosedDateEntry[]>(
    () => (provider.closedDates ?? [])
  );
  const [newEntry, setNewEntry] = useState<ClosedDateEntry>({ from: "", to: "", reason: "" });
  const [showAddForm, setShowAddForm] = useState(false);

  /**
   * Stale-data detection:
   * When the user opens edit mode we snapshot the current server data. If the
   * parent query refetches in the background and delivers a newer provider prop
   * while the user is still editing, we show a warning so they can decide
   * whether to reload the latest data or keep their in-progress draft.
   */
  const [staleWarning, setStaleWarning] = useState(false);
  const serverSnapshotRef = useRef<ProviderSnapshot | null>(null);

  // Tracks the last provider.schedule value we applied to state.
  // Initialised to the mount-time prop so the effect skips the first render.
  // Updated in onSuccess (before setEditing(false)) so that leaving edit mode
  // after a save never re-applies a stale prop that arrived mid-edit.
  const lastSyncedScheduleRef = useRef<
    ScheduleEditCardProps["provider"]["schedule"] | undefined
  >(provider.schedule);

  // Sync schedule from fresh server props while NOT editing.
  // Keeps the read-only display current after a type-change re-fetch or any
  // background invalidation.  Only fires when provider.schedule has genuinely
  // changed (new object from server), not on every re-render or when editing
  // transitions to false after a successful save.
  useEffect(() => {
    if (editing) return;
    if (
      JSON.stringify(provider.schedule) ===
      JSON.stringify(lastSyncedScheduleRef.current)
    )
      return;
    lastSyncedScheduleRef.current = provider.schedule;
    setSchedule(buildInitialSchedule(provider.schedule));
  }, [provider.schedule, editing]);

  // Watch for incoming prop changes while editing is active.
  useEffect(() => {
    if (!editing || !serverSnapshotRef.current) return;
    const snap = serverSnapshotRef.current;
    const scheduleChanged =
      JSON.stringify(provider.schedule) !== JSON.stringify(snap.schedule);
    const noteChanged = provider.closureNote !== snap.closureNote;
    const datesChanged =
      JSON.stringify(provider.closedDates) !== JSON.stringify(snap.closedDates);
    if (scheduleChanged || noteChanged || datesChanged) {
      setStaleWarning(true);
    }
  }, [provider, editing]);

  const patchMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/providers/${provider.id}`, payload);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to update schedule");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Schedule updated!", description: "Your availability is now live on your profile." });
      queryClient.invalidateQueries({ queryKey: ["/api/providers/mine"] });
      // Reflect the saved note and closed-dates immediately in the read-only
      // view so families see it right away, before React Query delivers the
      // refreshed prop.
      setSavedClosureNote(closureNote.trim());
      setSavedClosedDates([...closedDates]);
      // Advance the ref to the current prop so the sync effect's equality
      // check finds a match when editing → false triggers it.  Without this,
      // any prop change that arrived mid-edit (e.g. a type-switch re-fetch)
      // would be seen as "new" and overwrite the just-saved schedule before
      // React Query delivers the true post-save data.
      lastSyncedScheduleRef.current = provider.schedule;
      setStaleWarning(false);
      serverSnapshotRef.current = null;
      setEditing(false);
    },
    onError: (error: any) => {
      toast({ title: "Could not save schedule", description: error.message, variant: "destructive" });
    },
  });

  function updateDay(day: DayKey, field: keyof DaySchedule, value: boolean | string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  function addClosedDate() {
    if (!newEntry.from || !newEntry.to) {
      toast({ title: "Missing dates", description: "Please select a start and end date.", variant: "destructive" });
      return;
    }
    if (newEntry.to < newEntry.from) {
      toast({ title: "Invalid range", description: "End date must be on or after start date.", variant: "destructive" });
      return;
    }
    setClosedDates((prev) => [...prev, { ...newEntry, reason: newEntry.reason?.trim() || undefined }]);
    setNewEntry({ from: "", to: "", reason: "" });
    setShowAddForm(false);
  }

  function removeClosedDate(index: number) {
    setClosedDates((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    // Validate open days have valid times
    for (const day of DAYS) {
      const d = schedule[day];
      if (d.isOpen) {
        if (!d.open || !d.close) {
          toast({
            title: "Missing hours",
            description: `Please set open and close times for ${day}.`,
            variant: "destructive",
          });
          return;
        }
        if (d.close <= d.open) {
          toast({
            title: "Invalid hours",
            description: `Close time must be after open time for ${day}.`,
            variant: "destructive",
          });
          return;
        }
      }
    }
    patchMutation.mutate({
      schedule,
      closureNote: closureNote.trim() || null,
      closedDates: closedDates.length > 0 ? closedDates : null,
    });
  }

  function handleCancel() {
    setSchedule(buildInitialSchedule(provider.schedule));
    setClosureNote(savedClosureNote);
    setClosedDates(provider.closedDates ?? []);
    setNewEntry({ from: "", to: "", reason: "" });
    setShowAddForm(false);
    setStaleWarning(false);
    serverSnapshotRef.current = null;
    setEditing(false);
  }

  /**
   * Called when the user clicks "Reload latest" in the stale-data warning.
   * Resets all draft state to whatever the parent delivered in the newest prop,
   * then clears the warning so editing can resume from a fresh baseline.
   */
  function handleReloadFromServer() {
    serverSnapshotRef.current = {
      schedule: provider.schedule,
      closureNote: provider.closureNote,
      closedDates: provider.closedDates,
    };
    setSchedule(buildInitialSchedule(provider.schedule));
    setClosureNote(provider.closureNote ?? "");
    setClosedDates(provider.closedDates ?? []);
    setNewEntry({ from: "", to: "", reason: "" });
    setShowAddForm(false);
    setStaleWarning(false);
  }

  // Read-only summary
  const openDays = DAYS.filter((d) => schedule[d].isOpen);
  const today = todayIso();
  const upcomingClosures = savedClosedDates
    .filter((e) => e.to >= today)
    .sort((a, b) => a.from.localeCompare(b.from));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-evergreen" />
            <CardTitle className="text-lg">Schedule</CardTitle>
          </div>
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Capture the server data as it stands right now so we can
                // detect background refetches that arrive while editing.
                serverSnapshotRef.current = {
                  schedule: provider.schedule,
                  closureNote: provider.closureNote,
                  closedDates: provider.closedDates,
                };
                setEditing(true);
              }}
              className="h-8 px-2"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
        </div>
        <CardDescription>Operating hours shown to families on your profile</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {!editing ? (
          /* Read-only display */
          <>
            {openDays.length === 0 ? (
              <p className="text-sm text-gray-500">No hours set — click Edit to add your schedule.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {DAYS.filter((d) => schedule[d].isOpen).map((day) => (
                  <li key={day} className="flex justify-between">
                    <span className="capitalize text-gray-700 font-medium">{day}</span>
                    <span className="text-gray-600">
                      {formatTime(schedule[day].open)} – {formatTime(schedule[day].close)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {savedClosureNote && (
              <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                <span>{savedClosureNote}</span>
              </div>
            )}
            {/* Upcoming structured closures in read-only mode */}
            {upcomingClosures.length > 0 && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <CalendarX className="h-3.5 w-3.5" />
                  Upcoming Closures
                </div>
                <ul className="space-y-1">
                  {upcomingClosures.map((entry, i) => (
                    <li key={i} className="flex items-start gap-2 rounded-md bg-red-50 border border-red-100 px-3 py-1.5 text-sm text-red-800">
                      <span className="font-medium shrink-0">
                        {entry.from === entry.to
                          ? formatDate(entry.from)
                          : `${formatDate(entry.from)} – ${formatDate(entry.to)}`}
                      </span>
                      {entry.reason && <span className="text-red-600">· {entry.reason}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          /* Edit form */
          <div className="space-y-3">
            {/* Stale-data warning — shown when the server data changed while editing */}
            {staleWarning && (
              <div
                role="alert"
                className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                  <div className="flex-1">
                    <span className="font-medium">
                      Your schedule was updated elsewhere.
                    </span>{" "}
                    <span>
                      Reload the latest version or keep editing your current
                      draft — your changes will not be overwritten automatically.
                    </span>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs gap-1"
                        onClick={handleReloadFromServer}
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reload latest
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => setStaleWarning(false)}
                      >
                        Keep editing
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                <div className="flex items-center gap-2 w-28">
                  <Checkbox
                    id={`sec-${day}`}
                    checked={schedule[day].isOpen}
                    onCheckedChange={(checked) => updateDay(day, "isOpen", checked !== false)}
                  />
                  <Label htmlFor={`sec-${day}`} className="capitalize cursor-pointer text-sm">
                    {day}
                  </Label>
                </div>

                {schedule[day].isOpen ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={schedule[day].open}
                      onChange={(e) => updateDay(day, "open", e.target.value)}
                      className="w-28 h-8 text-sm"
                    />
                    <span className="text-xs text-gray-400">to</span>
                    <Input
                      type="time"
                      value={schedule[day].close}
                      onChange={(e) => updateDay(day, "close", e.target.value)}
                      className="w-28 h-8 text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 flex-1">Closed</span>
                )}
              </div>
            ))}

            {/* Closure / holiday note */}
            <div className="pt-1 space-y-1.5">
              <Label htmlFor="closure-note" className="text-sm font-medium">
                Closure note <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="closure-note"
                value={closureNote}
                onChange={(e) => setClosureNote(e.target.value)}
                placeholder="e.g. Closed Dec 24–Jan 1 for winter break. Closed on all NYC public school holidays."
                className="min-h-[72px] text-sm resize-none"
                maxLength={500}
                aria-describedby="closure-note-counter closure-note-hint"
              />
              <div className="flex items-center justify-between gap-2">
                <p id="closure-note-hint" className="text-xs text-gray-400">
                  Shown to families on your profile so they know about holiday closures or exceptions.
                </p>
                <p
                  id="closure-note-counter"
                  aria-live="polite"
                  aria-atomic="true"
                  className={`text-xs tabular-nums shrink-0 ${
                    closureNote.length >= 500
                      ? "text-red-600 font-semibold"
                      : closureNote.length >= 450
                      ? "text-amber-500 font-medium"
                      : "text-gray-400"
                  }`}
                >
                  {closureNote.length} / 500
                </p>
              </div>
            </div>

            {/* Structured closed date ranges */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarX className="h-4 w-4 text-gray-500" />
                  Closed Date Ranges
                  <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                {!showAddForm && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="h-3 w-3" />
                    Add closure
                  </Button>
                )}
              </div>

              {/* Existing entries */}
              {closedDates.length > 0 && (
                <ul className="space-y-1.5">
                  {closedDates.map((entry, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-1.5 text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-red-800">
                          {entry.from === entry.to
                            ? formatDate(entry.from)
                            : `${formatDate(entry.from)} – ${formatDate(entry.to)}`}
                        </span>
                        {entry.reason && (
                          <span className="ml-2 text-red-600 truncate">· {entry.reason}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeClosedDate(i)}
                        className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
                        aria-label="Remove closure"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add new entry form */}
              {showAddForm && (
                <div className="rounded-md border border-dashed border-gray-300 p-3 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Start date</Label>
                      <Input
                        type="date"
                        value={newEntry.from}
                        min={todayIso()}
                        onChange={(e) =>
                          setNewEntry((p) => ({
                            ...p,
                            from: e.target.value,
                            to: p.to < e.target.value ? e.target.value : p.to,
                          }))
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">End date</Label>
                      <Input
                        type="date"
                        value={newEntry.to}
                        min={newEntry.from || todayIso()}
                        onChange={(e) => setNewEntry((p) => ({ ...p, to: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">
                      Reason <span className="text-gray-400">(optional)</span>
                    </Label>
                    <Input
                      value={newEntry.reason}
                      onChange={(e) => setNewEntry((p) => ({ ...p, reason: e.target.value }))}
                      placeholder="e.g. Winter break, Staff training"
                      className="h-8 text-sm"
                      maxLength={200}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="button" size="sm" className="h-7 px-3 text-xs" onClick={addClosedDate}>
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-3 text-xs"
                      onClick={() => { setShowAddForm(false); setNewEntry({ from: "", to: "", reason: "" }); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {closedDates.length === 0 && !showAddForm && (
                <p className="text-xs text-gray-400">
                  Add specific date ranges when you'll be closed (holidays, breaks, etc.).
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={patchMutation.isPending}
                className="gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                {patchMutation.isPending ? "Saving…" : "Save Schedule"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={patchMutation.isPending}
                className="gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
