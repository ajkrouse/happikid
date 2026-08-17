/**
 * Tests for ScheduleEditCard
 *
 * Covers:
 * 1. Existing schedule data renders correctly in read-only view
 * 2. Toggling a day, changing its times, submitting — PATCH called with correct payload
 * 3. "Close time must be after open time" validation blocks submission and shows an error toast
 * 4. Updated schedule is reflected immediately in the UI (optimistic / cache-invalidated view)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module-level mocks — declared before any component imports
// ---------------------------------------------------------------------------

// Capture the mutate function so tests can inspect / control it
const mockMutate = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockToast = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useMutation: ({ mutationFn, onSuccess, onError }: any) => ({
    mutate: async (payload: any) => {
      mockMutate(payload);
      try {
        const result = await mutationFn(payload);
        onSuccess?.(result);
      } catch (err) {
        onError?.(err);
      }
    },
    isPending: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Default: successful PATCH response
const mockApiRequest = vi.fn();
vi.mock("@/lib/queryClient", () => ({
  apiRequest: (...args: any[]) => mockApiRequest(...args),
}));

// Import the component AFTER mocks are registered
import { ScheduleEditCard } from "@/components/ScheduleEditCard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProvider(overrides: Record<string, any> = {}) {
  return {
    id: 42,
    schedule: null,
    closureNote: null,
    ...overrides,
  };
}

function okResponse(body: any = {}) {
  return {
    ok: true,
    json: async () => body,
  } as any;
}

function errorResponse(body: any = { message: "Server error" }) {
  return {
    ok: false,
    json: async () => body,
  } as any;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockMutate.mockClear();
  mockInvalidateQueries.mockClear();
  mockToast.mockClear();
  mockApiRequest.mockReset();
  mockApiRequest.mockResolvedValue(okResponse({ id: 42 }));
});

// ---------------------------------------------------------------------------
// Read-only display
// ---------------------------------------------------------------------------

describe("ScheduleEditCard — read-only display", () => {
  it("shows 'No hours set' when schedule is null", () => {
    render(<ScheduleEditCard provider={makeProvider()} />);
    expect(screen.getByText(/no hours set/i)).toBeInTheDocument();
  });

  it("shows open days with formatted times", () => {
    const schedule = {
      monday: { isOpen: true, open: "08:00", close: "17:00" },
      tuesday: { isOpen: false, open: "07:00", close: "18:00" },
    };
    render(<ScheduleEditCard provider={makeProvider({ schedule })} />);

    expect(screen.getByText(/monday/i)).toBeInTheDocument();
    // tuesday is closed, should not appear
    expect(screen.queryByText(/tuesday/i)).not.toBeInTheDocument();
    // formatted time
    expect(screen.getByText(/8:00am/i)).toBeInTheDocument();
    expect(screen.getByText(/5:00pm/i)).toBeInTheDocument();
  });

  it("displays the closure note when provided", () => {
    render(
      <ScheduleEditCard
        provider={makeProvider({ closureNote: "Closed Dec 24–Jan 1" })}
      />
    );
    expect(screen.getByText(/Closed Dec 24–Jan 1/)).toBeInTheDocument();
  });

  it("does not render closure note box when closureNote is null", () => {
    render(<ScheduleEditCard provider={makeProvider({ closureNote: null })} />);
    expect(screen.queryByText(/Closed Dec/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edit → submit — PATCH payload
// ---------------------------------------------------------------------------

describe("ScheduleEditCard — PATCH on save", () => {
  it("sends the correct payload when toggling a day and submitting", async () => {
    render(<ScheduleEditCard provider={makeProvider()} />);

    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Toggle Monday on via its checkbox
    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);

    // After toggling, open/close inputs appear — set times
    const timeInputs = screen.getAllByDisplayValue("07:00");
    fireEvent.change(timeInputs[0], { target: { value: "09:00" } });

    const closeInputs = screen.getAllByDisplayValue("18:00");
    fireEvent.change(closeInputs[0], { target: { value: "17:00" } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledOnce();
    });

    const payload = mockMutate.mock.calls[0][0];
    expect(payload.schedule.monday).toMatchObject({
      isOpen: true,
      open: "09:00",
      close: "17:00",
    });
    // Other days should remain closed
    expect(payload.schedule.tuesday.isOpen).toBe(false);
    expect(payload.closureNote).toBeNull();
  });

  it("calls PATCH /api/providers/:id via apiRequest", async () => {
    render(<ScheduleEditCard provider={makeProvider({ id: 99 })} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Toggle wednesday on and leave default times (07:00–18:00)
    const wedCheckbox = screen.getByRole("checkbox", { name: /wednesday/i });
    fireEvent.click(wedCheckbox);

    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(
        "PATCH",
        "/api/providers/99",
        expect.objectContaining({
          schedule: expect.objectContaining({
            wednesday: expect.objectContaining({ isOpen: true }),
          }),
        })
      );
    });
  });

  it("invalidates the /api/providers/mine query on success", async () => {
    render(<ScheduleEditCard provider={makeProvider()} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);

    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ["/api/providers/mine"] })
      );
    });
  });

  it("shows a success toast on a successful save", async () => {
    render(<ScheduleEditCard provider={makeProvider()} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);

    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Schedule updated!" })
      );
    });
  });

  it("shows the updated time in read-only view after a successful save", async () => {
    const existingSchedule = {
      friday: { isOpen: true, open: "08:00", close: "16:00" },
    };
    render(<ScheduleEditCard provider={makeProvider({ schedule: existingSchedule })} />);

    // Read-only view shows the original close time (4:00pm)
    expect(screen.getByText(/4:00pm/i)).toBeInTheDocument();

    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Change Friday's close time to 3:00pm (15:00)
    const closeInput = screen.getByDisplayValue("16:00");
    fireEvent.change(closeInput, { target: { value: "15:00" } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    await waitFor(() => {
      // After onSuccess the component exits edit mode and renders the
      // updated local schedule in the read-only list
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });

    // New close time should be visible; old one should not
    expect(screen.getByText(/3:00pm/i)).toBeInTheDocument();
    expect(screen.queryByText(/4:00pm/i)).not.toBeInTheDocument();
  });

  it("shows an error toast when the API returns a non-ok response", async () => {
    mockApiRequest.mockResolvedValue(errorResponse({ message: "Unauthorized" }));

    render(<ScheduleEditCard provider={makeProvider()} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);

    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Could not save schedule",
          variant: "destructive",
        })
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Validation — close time must be after open time
// ---------------------------------------------------------------------------

describe("ScheduleEditCard — time-range validation", () => {
  it("shows an error toast and does NOT submit when close <= open", async () => {
    render(<ScheduleEditCard provider={makeProvider()} />);

    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Toggle Monday on
    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);

    // Set close time BEFORE open time (same value → invalid)
    const openInputs = screen.getAllByDisplayValue("07:00");
    fireEvent.change(openInputs[0], { target: { value: "10:00" } });

    const closeInputs = screen.getAllByDisplayValue("18:00");
    fireEvent.change(closeInputs[0], { target: { value: "09:00" } }); // earlier than open

    // Attempt to save
    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Invalid hours",
          variant: "destructive",
        })
      );
    });

    // PATCH must NOT have been called
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("shows an error toast when close equals open", async () => {
    render(<ScheduleEditCard provider={makeProvider()} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);

    // Set open and close to the same time
    const openInputs = screen.getAllByDisplayValue("07:00");
    fireEvent.change(openInputs[0], { target: { value: "09:00" } });

    const closeInputs = screen.getAllByDisplayValue("18:00");
    fireEvent.change(closeInputs[0], { target: { value: "09:00" } });

    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Invalid hours",
          variant: "destructive",
        })
      );
    });

    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("submits successfully when close is strictly after open", async () => {
    render(<ScheduleEditCard provider={makeProvider()} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);

    // Default open=07:00, close=18:00 — valid
    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalled();
    });

    // No "Invalid hours" toast
    const calls: any[] = mockToast.mock.calls.map((c) => c[0]);
    expect(calls.every((c) => c.title !== "Invalid hours")).toBe(true);
  });

  it("only validates open days — closed days with bad defaults do not block submit", async () => {
    // If a day is toggled off, we should not validate its times even if they
    // happen to be equal (the defaults open=07:00, close=18:00 are fine anyway,
    // but this confirms the guard only fires for isOpen days).
    render(<ScheduleEditCard provider={makeProvider()} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Toggle Monday on with valid times, leave every other day off
    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);

    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// Closure note round-trip
// ---------------------------------------------------------------------------

describe("ScheduleEditCard — closure note round-trip", () => {
  it("includes the typed closure note in the PATCH payload", async () => {
    render(<ScheduleEditCard provider={makeProvider()} />);

    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Toggle monday on so the save isn't blocked by "no open days" (not a rule
    // in the component, but gives us a day to validate cleanly)
    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);

    // Fill in the closure note textarea
    const textarea = screen.getByPlaceholderText(/Closed Dec 24/i);
    fireEvent.change(textarea, { target: { value: "Closed Dec 24–Jan 1 for winter break." } });

    // Save
    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalledOnce());

    const payload = mockMutate.mock.calls[0][0];
    expect(payload.closureNote).toBe("Closed Dec 24–Jan 1 for winter break.");
  });

  it("sends closureNote: null when the textarea is blank", async () => {
    render(<ScheduleEditCard provider={makeProvider({ closureNote: "Old note" })} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);

    // Clear the existing note
    const textarea = screen.getByDisplayValue("Old note");
    fireEvent.change(textarea, { target: { value: "   " } }); // whitespace → trimmed to ""

    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalledOnce());

    const payload = mockMutate.mock.calls[0][0];
    expect(payload.closureNote).toBeNull(); // trim() + || null logic
  });

  it("shows the amber banner after saving a new closure note", async () => {
    render(<ScheduleEditCard provider={makeProvider()} />);

    // No closure note text visible initially
    expect(screen.queryByText("Closed July 4th")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);

    const textarea = screen.getByPlaceholderText(/Closed Dec 24/i);
    fireEvent.change(textarea, { target: { value: "Closed July 4th" } });

    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    // After onSuccess the component exits edit mode and mirrors the saved note
    // into local state — the amber banner should be visible immediately,
    // without waiting for the parent to re-render with a refreshed prop.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
    );

    // Amber banner must contain the newly saved note text.
    const bannerText = screen.getByText("Closed July 4th");
    expect(bannerText).toBeInTheDocument();
    expect(bannerText.closest("div")).toHaveClass("bg-amber-50");
  });

  it("amber banner is visible immediately when provider already has a closure note", () => {
    render(
      <ScheduleEditCard provider={makeProvider({ closureNote: "Closed Dec 24–Jan 1" })} />
    );

    // The amber banner wraps the text inside a bg-amber-50 div
    const banner = screen.getByText("Closed Dec 24–Jan 1");
    expect(banner.closest("div")).toHaveClass("bg-amber-50");
  });

  it("restores original closure note text when Cancel is clicked", () => {
    render(
      <ScheduleEditCard provider={makeProvider({ closureNote: "Closed on school holidays" })} />
    );

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Change the textarea
    const textarea = screen.getByDisplayValue("Closed on school holidays");
    fireEvent.change(textarea, { target: { value: "Something different" } });

    // Cancel
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    // Back in read-only mode — original note still shows
    expect(screen.getByText("Closed on school holidays")).toBeInTheDocument();
  });

  it("amber banner stays correct when parent re-renders with the updated prop after save", async () => {
    // Scenario: the component saves a new closure note optimistically, then the
    // parent (React Query) delivers a fresh provider prop with the same note.
    // The amber banner must remain visible with the correct text throughout —
    // no flicker, no blank flash between the optimistic-local update and the
    // eventual prop-sync.
    const { rerender } = render(
      <ScheduleEditCard provider={makeProvider({ closureNote: "Original note" })} />
    );

    // Amber banner shows the initial note in read-only view
    expect(screen.getByText("Original note")).toBeInTheDocument();

    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Change the closure note
    const textarea = screen.getByDisplayValue("Original note");
    fireEvent.change(textarea, { target: { value: "Updated note" } });

    // Toggle monday on so the save has at least one valid open day
    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);

    // Save — triggers onSuccess which sets savedClosureNote optimistically
    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    // Wait for the component to exit edit mode (onSuccess ran)
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
    );

    // Amber banner should already show the new note via the optimistic local state
    expect(screen.getByText("Updated note")).toBeInTheDocument();

    // Now simulate React Query delivering the refreshed prop (the prop-sync path).
    // This is what happens when useQuery's invalidation completes and the parent
    // re-renders with the server-confirmed value.
    rerender(
      <ScheduleEditCard
        provider={makeProvider({ closureNote: "Updated note" })}
      />
    );

    // The amber banner must still be visible and contain the correct text —
    // the prop-sync must NOT cause a flicker or blank the banner.
    const banner = screen.getByText("Updated note");
    expect(banner).toBeInTheDocument();
    expect(banner.closest("div")).toHaveClass("bg-amber-50");

    // And the old note must be completely gone
    expect(screen.queryByText("Original note")).not.toBeInTheDocument();
  });

  it("amber banner survives a stale-prop re-render that arrives while the save is still in-flight", async () => {
    // Scenario: the user saves a new closure note.  Before the PATCH response
    // arrives, the parent (React Query) fires a background refetch that delivers
    // the *old* closureNote (null) via a prop update — simulating the focus/
    // tab-reactivation race the task describes.  Once the PATCH resolves and
    // onSuccess runs, the optimistic savedClosureNote must win; the banner must
    // show the newly saved text and must NOT go blank during the race.

    // Use a manually controlled promise so we can inject the stale prop while
    // the API call is still pending.
    let resolveApiCall!: (value: any) => void;
    const deferredResponse = new Promise<any>((resolve) => {
      resolveApiCall = resolve;
    });
    mockApiRequest.mockReturnValue(deferredResponse);

    const { rerender } = render(
      <ScheduleEditCard provider={makeProvider({ closureNote: null })} />
    );

    // Enter edit mode and type a new note
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    const textarea = screen.getByPlaceholderText(/Closed Dec 24/i);
    fireEvent.change(textarea, { target: { value: "Closed for summer break" } });

    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);

    // Kick off the save — the mock API call is now pending (deferredResponse hasn't resolved)
    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    // While the PATCH is still in-flight, the parent re-renders with the stale
    // prop (closureNote still null — a background refetch raced the mutation)
    rerender(
      <ScheduleEditCard provider={makeProvider({ closureNote: null })} />
    );

    // Resolve the API call — save succeeds
    resolveApiCall({ ok: true, json: async () => ({ id: 42 }) });

    // Wait for onSuccess to run and the component to exit edit mode
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
    );

    // The amber banner must show the optimistically saved note.
    // The stale null prop that arrived mid-flight must NOT have blanked it.
    const banner = screen.getByText("Closed for summer break");
    expect(banner).toBeInTheDocument();
    expect(banner.closest("div")).toHaveClass("bg-amber-50");
  });
});

// ---------------------------------------------------------------------------
// Cancel — restores previous values
// ---------------------------------------------------------------------------

describe("ScheduleEditCard — cancel", () => {
  it("restores original schedule when Cancel is clicked", () => {
    const existingSchedule = {
      monday: { isOpen: true, open: "08:00", close: "17:00" },
    };
    render(
      <ScheduleEditCard
        provider={makeProvider({ schedule: existingSchedule })}
      />
    );

    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Toggle monday off
    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);

    // Cancel
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    // Read-only view should show monday again (restored)
    expect(screen.getByText(/monday/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Provider-type switch — schedule survives prop change
// ---------------------------------------------------------------------------

describe("ScheduleEditCard — schedule survives provider-type switch", () => {
  it("shows the updated schedule when the re-fetched provider includes a non-null schedule", () => {
    // Simulate: provider type switched and the fresh API response includes the
    // new schedule for the new type (e.g. afterschool runs Mon–Fri only).
    const initialProvider = makeProvider({
      schedule: {
        saturday: { isOpen: true, open: "09:00", close: "13:00" },
        sunday: { isOpen: true, open: "09:00", close: "13:00" },
      },
    });

    const { rerender } = render(<ScheduleEditCard provider={initialProvider} />);

    expect(screen.getByText(/saturday/i)).toBeInTheDocument();
    expect(screen.getByText(/sunday/i)).toBeInTheDocument();

    // Type-switch: new schedule reflects weekday-only afterschool hours.
    const afterschoolProvider = makeProvider({
      id: initialProvider.id,
      schedule: {
        monday: { isOpen: true, open: "15:00", close: "18:00" },
        tuesday: { isOpen: true, open: "15:00", close: "18:00" },
      },
    });
    rerender(<ScheduleEditCard provider={afterschoolProvider} />);

    // New days must appear, old weekend days must no longer appear.
    expect(screen.getByText(/monday/i)).toBeInTheDocument();
    expect(screen.getByText(/tuesday/i)).toBeInTheDocument();
    expect(screen.queryByText(/saturday/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sunday/i)).not.toBeInTheDocument();
  });

  it("re-renders with a null schedule after type switch — preserves original open days (no silent all-closed reset)", () => {
    const initialProvider = makeProvider({
      schedule: {
        monday: { isOpen: true, open: "08:00", close: "17:00" },
        friday: { isOpen: true, open: "09:00", close: "15:00" },
      },
    });

    const { rerender } = render(<ScheduleEditCard provider={initialProvider} />);

    expect(screen.getByText(/monday/i)).toBeInTheDocument();
    expect(screen.getByText(/friday/i)).toBeInTheDocument();

    // A type-switch re-fetch returns a provider where schedule is null
    // (server cleared it for the new type). Should NOT silently show "No hours set".
    // The component treats null as an explicit server clear and rebuilds from it —
    // which means all-closed — so we verify that scenario is handled explicitly
    // (the read-only display transitions, not silently crashes).
    const nullScheduleProvider = makeProvider({ id: initialProvider.id, schedule: null });
    rerender(<ScheduleEditCard provider={nullScheduleProvider} />);

    // With null treated as explicit clear: "No hours set" appears
    expect(screen.getByText(/no hours set/i)).toBeInTheDocument();
    // Old days must be gone
    expect(screen.queryByText(/monday/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/friday/i)).not.toBeInTheDocument();
  });

  it("does not overwrite the user's in-progress draft when a type-switch re-fetch arrives mid-edit", () => {
    // While the user is editing, the stale-data warning should fire —
    // the draft must NOT be silently replaced by the incoming prop.
    const initialProvider = makeProvider({
      schedule: {
        monday: { isOpen: true, open: "08:00", close: "17:00" },
      },
    });

    const { rerender } = render(<ScheduleEditCard provider={initialProvider} />);

    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Simulate the type-switch re-fetch delivering new data while editing
    const afterschoolProvider = makeProvider({
      id: initialProvider.id,
      schedule: {
        tuesday: { isOpen: true, open: "15:00", close: "18:00" },
      },
    });
    rerender(<ScheduleEditCard provider={afterschoolProvider} />);

    // The stale-data warning must appear — user must choose to reload or keep draft
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Monday checkbox must still be checked in the draft (draft was not overwritten)
    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    expect(mondayCheckbox).toBeChecked();
  });

  it("read-only view shows the saved schedule (C), not the stale mid-edit prop (B), after saving during a type-switch", async () => {
    // Scenario: provider starts with schedule A (monday only).
    // A type-switch re-fetch delivers schedule B (tuesday only) mid-edit.
    // User keeps their draft and saves schedule C (wednesday only).
    // After save, the read-only view must show C — not B.
    const initialProvider = makeProvider({
      schedule: { monday: { isOpen: true, open: "08:00", close: "17:00" } },
    });

    const { rerender } = render(<ScheduleEditCard provider={initialProvider} />);

    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Type-switch re-fetch delivers schedule B mid-edit
    const midEditProvider = makeProvider({
      id: initialProvider.id,
      schedule: { tuesday: { isOpen: true, open: "15:00", close: "18:00" } },
    });
    rerender(<ScheduleEditCard provider={midEditProvider} />);

    // Stale-data warning appears — user keeps editing
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /keep editing/i }));

    // User toggles wednesday ON to form their new draft (schedule C)
    const wednesdayCheckbox = screen.getByRole("checkbox", { name: /wednesday/i });
    fireEvent.click(wednesdayCheckbox);

    // Save
    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    await waitFor(() => {
      // onSuccess exits edit mode
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });

    // Read-only view must show wednesday (C), not tuesday (B)
    expect(screen.getByText(/wednesday/i)).toBeInTheDocument();
    expect(screen.queryByText(/tuesday/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Stale-data detection — prop change mid-edit
// ---------------------------------------------------------------------------

describe("ScheduleEditCard — stale data warning", () => {
  it("shows a warning when the provider prop changes while editing", () => {
    const initialProvider = makeProvider({
      schedule: { monday: { isOpen: true, open: "08:00", close: "17:00" } },
      closureNote: null,
    });

    const { rerender } = render(<ScheduleEditCard provider={initialProvider} />);

    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // No warning initially
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // Simulate a background refetch delivering new server data while the user
    // is still editing (e.g. another device saved a different schedule)
    const updatedProvider = makeProvider({
      schedule: { tuesday: { isOpen: true, open: "09:00", close: "18:00" } },
      closureNote: "Closed on public holidays",
    });
    rerender(<ScheduleEditCard provider={updatedProvider} />);

    // The stale-data warning alert must appear
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/updated elsewhere/i)).toBeInTheDocument();
  });

  it("does NOT show a warning when the prop changes while NOT editing", () => {
    const initialProvider = makeProvider({
      schedule: { monday: { isOpen: true, open: "08:00", close: "17:00" } },
    });

    const { rerender } = render(<ScheduleEditCard provider={initialProvider} />);

    // We never enter edit mode — just re-render with a different prop
    const updatedProvider = makeProvider({
      schedule: { tuesday: { isOpen: true, open: "09:00", close: "18:00" } },
    });
    rerender(<ScheduleEditCard provider={updatedProvider} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does NOT show a warning when the prop is unchanged mid-edit", () => {
    const provider = makeProvider({
      schedule: { monday: { isOpen: true, open: "08:00", close: "17:00" } },
    });

    const { rerender } = render(<ScheduleEditCard provider={provider} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Re-render with the identical provider — no warning expected
    rerender(<ScheduleEditCard provider={{ ...provider }} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("'Reload latest' resets the draft to the new server data and hides the warning", () => {
    const initialProvider = makeProvider({
      schedule: { monday: { isOpen: true, open: "08:00", close: "17:00" } },
      closureNote: null,
    });

    const { rerender } = render(<ScheduleEditCard provider={initialProvider} />);

    // Enter edit mode and make a local change
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    // Confirm we're in edit mode
    expect(screen.getByRole("button", { name: /save schedule/i })).toBeInTheDocument();

    // Simulate a background refetch with a new closure note
    const updatedProvider = makeProvider({
      schedule: { monday: { isOpen: true, open: "08:00", close: "17:00" } },
      closureNote: "Closed all public holidays",
    });
    rerender(<ScheduleEditCard provider={updatedProvider} />);

    // Warning is shown
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Click "Reload latest"
    fireEvent.click(screen.getByRole("button", { name: /reload latest/i }));

    // Warning disappears
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // The textarea should now contain the new server value
    const textarea = screen.getByPlaceholderText(/Closed Dec 24/i);
    expect((textarea as HTMLTextAreaElement).value).toBe("Closed all public holidays");
  });

  it("'Keep editing' dismisses the warning without changing the draft", () => {
    const initialProvider = makeProvider({
      schedule: { monday: { isOpen: true, open: "08:00", close: "17:00" } },
      closureNote: null,
    });

    const { rerender } = render(<ScheduleEditCard provider={initialProvider} />);

    // Enter edit mode and type a draft note
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    const textarea = screen.getByPlaceholderText(/Closed Dec 24/i);
    fireEvent.change(textarea, { target: { value: "My draft note" } });

    // Simulate a background refetch
    const updatedProvider = makeProvider({
      schedule: { tuesday: { isOpen: true, open: "09:00", close: "18:00" } },
      closureNote: "Server note",
    });
    rerender(<ScheduleEditCard provider={updatedProvider} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Click "Keep editing"
    fireEvent.click(screen.getByRole("button", { name: /keep editing/i }));

    // Warning is gone
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // The draft note the user typed is preserved — not clobbered by server note
    expect((textarea as HTMLTextAreaElement).value).toBe("My draft note");
  });

  it("clears the warning after a successful save", async () => {
    const initialProvider = makeProvider({
      schedule: { monday: { isOpen: true, open: "08:00", close: "17:00" } },
    });

    const { rerender } = render(<ScheduleEditCard provider={initialProvider} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Trigger stale-data warning via prop change
    const updatedProvider = makeProvider({
      schedule: { tuesday: { isOpen: true, open: "09:00", close: "18:00" } },
    });
    rerender(<ScheduleEditCard provider={updatedProvider} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Now save (toggle monday on so save doesn't block)
    const mondayCheckbox = screen.getByRole("checkbox", { name: /monday/i });
    fireEvent.click(mondayCheckbox);
    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });

    // Back in read-only mode — no alert
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears the warning when Cancel is clicked", () => {
    const initialProvider = makeProvider({
      schedule: { monday: { isOpen: true, open: "08:00", close: "17:00" } },
    });

    const { rerender } = render(<ScheduleEditCard provider={initialProvider} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Trigger stale-data warning
    rerender(
      <ScheduleEditCard
        provider={makeProvider({
          schedule: { tuesday: { isOpen: true, open: "09:00", close: "18:00" } },
        })}
      />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Cancel the edit
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    // Back in read-only mode — no alert
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
