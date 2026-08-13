import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Pencil, X, Save, AlertCircle } from "lucide-react";

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

interface ScheduleEditCardProps {
  provider: {
    id: number;
    schedule?: Record<string, { isOpen?: boolean; open?: string; close?: string }> | null;
    closureNote?: string | null;
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

export function ScheduleEditCard({ provider }: ScheduleEditCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleMap>(() =>
    buildInitialSchedule(provider.schedule)
  );
  const [closureNote, setClosureNote] = useState(provider.closureNote ?? "");

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
    patchMutation.mutate({ schedule, closureNote: closureNote.trim() || null });
  }

  function handleCancel() {
    setSchedule(buildInitialSchedule(provider.schedule));
    setClosureNote(provider.closureNote ?? "");
    setEditing(false);
  }

  // Read-only summary
  const openDays = DAYS.filter((d) => schedule[d].isOpen);

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
              onClick={() => setEditing(true)}
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
            {provider.closureNote && (
              <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                <span>{provider.closureNote}</span>
              </div>
            )}
          </>
        ) : (
          /* Edit form */
          <div className="space-y-3">
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
              />
              <p className="text-xs text-gray-400">
                Shown to families on your profile so they know about holiday closures or exceptions.
              </p>
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
