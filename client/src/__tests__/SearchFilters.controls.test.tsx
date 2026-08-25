import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SearchFilters from "@/components/SearchFilters";

function renderFilters(
  filters: Parameters<typeof SearchFilters>[0]["filters"] = {},
  onFiltersChange = vi.fn(),
) {
  render(
    <SearchFilters
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearFilters={vi.fn()}
    />,
  );
  return onFiltersChange;
}

function chooseOption(trigger: HTMLElement, name: string) {
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("option", { name }));
}

describe("SearchFilters — visible control contract", () => {
  it("maps provider type and county changes to filters, clearing city when the county changes", () => {
    const onChange = renderFilters({ borough: "Brooklyn", city: "Brooklyn" });
    const [typeTrigger, countyTrigger] = screen.getAllByRole("combobox");

    chooseOption(typeTrigger, "Summer Camps");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ type: "camp" }));

    chooseOption(countyTrigger, "Queens");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      borough: "Queens",
      city: undefined,
    }));
  });

  it("maps city, age, and price controls to the request filter state", () => {
    const onChange = renderFilters({ borough: "Hudson County" });
    const [, , cityTrigger] = screen.getAllByRole("combobox");

    chooseOption(cityTrigger, "Jersey City (88)");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ city: "Jersey City" }));

    fireEvent.click(screen.getByRole("radio", { name: /Toddlers/i }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ ageRange: "toddlers" }));

    fireEvent.click(screen.getByRole("radio", { name: /Under \$1,000\/mo/i }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ priceRange: "0-1000" }));
  });

  it("maps date, subsidy, and feature controls to their active filters and clears the date", () => {
    const onChange = renderFilters();

    fireEvent.change(screen.getByLabelText("Filter to providers open on this date"), {
      target: { value: "2026-09-20" },
    });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ openOn: "2026-09-20" }));

    fireEvent.click(screen.getByLabelText("Filter providers that accept childcare subsidies and vouchers"));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ acceptsSubsidies: true }));

    fireEvent.click(screen.getByLabelText("Swimming pool"));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ features: ["Swimming pool"] }));

    const clearDate = renderFilters({ openOn: "2026-09-20" });
    fireEvent.click(screen.getByLabelText("Clear open-on date filter"));
    expect(clearDate).toHaveBeenCalledWith(expect.objectContaining({ openOn: undefined }));
  });
});