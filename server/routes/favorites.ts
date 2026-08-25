import type { Express } from "express";
import { storage, SavedProviderGroupsConflictError } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { strictPathInt } from "../lib/pathParams";
import { apiError } from "../lib/apiError";
import { createLogger } from "../logger";
import { isPublicProvider, toPublicProvider } from "../lib/providerAccess";
import { z } from "zod";

const log = createLogger("favorites");

const savedGroupsSchema = z.object({
  groups: z.array(z.object({
    name: z.string().trim().min(1, "A group name is required").max(80, "Group names must be 80 characters or fewer"),
    providerIds: z.array(z.number().int().positive()).min(1, "A group needs at least one provider").max(100),
  }).strict()).max(50),
}).passthrough().superRefine(({ groups }, ctx) => {
  const names = new Set<string>();
  groups.forEach((group, index) => {
    const normalizedName = group.name.toLocaleLowerCase();
    if (names.has(normalizedName)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["groups", index, "name"],
        message: "Group names must be unique",
      });
    }
    names.add(normalizedName);
    if (new Set(group.providerIds).size !== group.providerIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["groups", index, "providerIds"],
        message: "A provider can appear only once in a group",
      });
    }
  });
});

const savedGroupsWriteSchema = savedGroupsSchema.and(z.object({
  revision: z.number().int().min(0),
}).passthrough());

function parseSavedGroupsPayload(body: unknown, requiresRevision = false) {
  return (requiresRevision ? savedGroupsWriteSchema : savedGroupsSchema).safeParse(body);
}

function toSavedGroupsResponse(state: Awaited<ReturnType<typeof storage.getSavedProviderGroupsState>>) {
  return {
    revision: state.revision,
    groups: state.groups.map((group) => {
    const visibleProviders = group.providers
      .filter(isPublicProvider)
      .map((provider) => toPublicProvider(provider as any));
    return {
      id: group.id,
      name: group.name,
      providerIds: visibleProviders.map((provider) => provider.id),
      providers: visibleProviders,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
    }),
  };
}

export function registerFavoriteRoutes(app: Express): void {
  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const favorites = await storage.getFavoritesByUserId(req.user?.claims?.sub);
      res.json(
        favorites
          .filter(({ provider }) => isPublicProvider(provider))
          .map(({ provider, ...favorite }) => ({
            ...favorite,
            provider: toPublicProvider(provider as any),
          })),
      );
    } catch (error) {
      log.error({ err: error }, "Error fetching favorites");
      apiError(res, 500, "Failed to fetch favorites");
    }
  });

  app.post("/api/favorites/:providerId", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.providerId);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      // Retries and concurrent requests return the canonical bookmark instead
      // of surfacing the unique-key conflict.
      const result = await storage.addFavorite(req.user?.claims?.sub, providerId);
      res.status(result.created ? 201 : 200).json(result.favorite);
    } catch (error) {
      log.error({ err: error }, "Error adding favorite");
      apiError(res, 500, "Failed to add favorite");
    }
  });

  app.delete("/api/favorites/:providerId", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.providerId);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      await storage.removeFavorite(req.user?.claims?.sub, providerId);
      res.status(204).send();
    } catch (error) {
      log.error({ err: error }, "Error removing favorite");
      apiError(res, 500, "Failed to remove favorite");
    }
  });

  app.get("/api/favorites/:providerId/check", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.providerId);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      res.json({ isFavorite: await storage.isFavorite(req.user?.claims?.sub, providerId) });
    } catch (error) {
      log.error({ err: error }, "Error checking favorite");
      apiError(res, 500, "Failed to check favorite");
    }
  });

  app.get("/api/favorite-groups", isAuthenticated, async (req: any, res) => {
    try {
      const state = await storage.getSavedProviderGroupsState(req.user?.claims?.sub);
      res.json(toSavedGroupsResponse(state));
    } catch (error) {
      log.error({ err: error }, "Error fetching saved provider groups");
      apiError(res, 500, "Failed to fetch saved groups");
    }
  });

  app.put("/api/favorite-groups", isAuthenticated, async (req: any, res) => {
    const parsed = parseSavedGroupsPayload(req.body, true);
    if (!parsed.success) return apiError(res, 400, "Invalid saved groups");
    try {
      const state = await storage.replaceSavedProviderGroups(
        req.user?.claims?.sub,
        parsed.data.groups,
        (parsed.data as z.infer<typeof savedGroupsWriteSchema>).revision,
      );
      res.json(toSavedGroupsResponse(state));
    } catch (error) {
      if (error instanceof SavedProviderGroupsConflictError) {
        return apiError(res, 409, "Saved groups changed in another session. Please retry.");
      }
      log.error({ err: error }, "Error saving provider groups");
      apiError(res, 500, "Failed to save groups");
    }
  });

  // Legacy browser-only groups are imported once after sign-in. The server
  // merges same-named groups instead of overwriting the account's groups.
  app.post("/api/favorite-groups/import", isAuthenticated, async (req: any, res) => {
    const parsed = parseSavedGroupsPayload(req.body);
    if (!parsed.success) return apiError(res, 400, "Invalid saved groups");
    try {
      const state = await storage.mergeSavedProviderGroups(req.user?.claims?.sub, parsed.data.groups);
      res.json(toSavedGroupsResponse(state));
    } catch (error) {
      log.error({ err: error }, "Error importing provider groups");
      apiError(res, 500, "Failed to import saved groups");
    }
  });
}
