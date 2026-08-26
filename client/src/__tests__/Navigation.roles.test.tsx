import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

const authState = vi.hoisted(() => ({
  user: null as any,
  isAuthenticated: false,
  isLoading: false,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => authState),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn((options: any) => ({
    data: options.queryKey?.[0] === "/api/admin/verifications" ? [] : [],
  })),
}));

vi.mock("@/components/RoleSelectionModal", () => ({
  default: () => null,
}));

import Navigation from "@/components/Navigation";

function renderNavigation(user: any) {
  authState.user = user;
  authState.isAuthenticated = Boolean(user);
  const { hook } = memoryLocation({ path: "/" });
  return render(
    <Router hook={hook}>
      <Navigation />
    </Router>,
  );
}

function linksFor(container: HTMLElement, href: string) {
  void container;
  return Array.from(document.body.querySelectorAll(`a[href="${href}"]`));
}

function openMobileMenu(container: HTMLElement) {
  const menuButton = container.querySelector("button");
  expect(menuButton).not.toBeNull();
  fireEvent.click(menuButton!);
}

describe("Navigation role visibility", () => {
  beforeEach(() => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
  });

  it("keeps provider and admin links out of a non-admin parent navigation", () => {
    const { container } = renderNavigation({
      id: "parent-1",
      role: "parent",
      firstName: "Pat",
    });

    expect(linksFor(container, "/provider/dashboard")).toHaveLength(0);
    expect(linksFor(container, "/admin/verifications")).toHaveLength(0);
    expect(linksFor(container, "/messages")).toHaveLength(1);

    openMobileMenu(container);
    expect(linksFor(container, "/search")).toHaveLength(1);
    expect(linksFor(container, "/provider/dashboard")).toHaveLength(0);
    expect(linksFor(container, "/admin/verifications")).toHaveLength(0);
  });

  it.each([
    ["direct/unclaimed provider", { id: "provider-direct", role: "provider" }],
    ["claimed provider", { id: "provider-claimed", role: "provider" }],
  ])("shows provider navigation for a %s without admin navigation", (_label, user) => {
    const { container } = renderNavigation(user);

    expect(linksFor(container, "/provider/dashboard")).toHaveLength(1);
    expect(linksFor(container, "/admin/verifications")).toHaveLength(0);

    openMobileMenu(container);
    expect(linksFor(container, "/provider/dashboard")).toHaveLength(2);
    expect(linksFor(container, "/admin/verifications")).toHaveLength(0);
  });

  it("shows verification navigation only for an admin reviewer", () => {
    const { container } = renderNavigation({
      id: "admin-1",
      role: "admin",
      firstName: "Ada",
    });

    expect(linksFor(container, "/admin/verifications")).toHaveLength(1);
    expect(linksFor(container, "/provider/dashboard")).toHaveLength(0);
    expect(linksFor(container, "/messages")).toHaveLength(1);

    openMobileMenu(container);
    expect(linksFor(container, "/admin/verifications")).toHaveLength(2);
    expect(linksFor(container, "/provider/dashboard")).toHaveLength(0);
  });

  it("does not show authenticated-only links to signed-out visitors", () => {
    const { container } = renderNavigation(null);

    expect(linksFor(container, "/provider/dashboard")).toHaveLength(0);
    expect(linksFor(container, "/admin/verifications")).toHaveLength(0);
    expect(linksFor(container, "/messages")).toHaveLength(0);
    expect(linksFor(container, "/search")).toHaveLength(1);
    expect(linksFor(container, "/providers")).toHaveLength(1);
  });
});