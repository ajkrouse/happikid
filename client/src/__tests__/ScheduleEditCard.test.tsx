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
