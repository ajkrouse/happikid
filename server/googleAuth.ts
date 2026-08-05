import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import crypto from "crypto";
import { storage } from "./storage";
import { createLogger } from "./logger";

const log = createLogger("google-auth");

export function setupGoogleAuth(app: Express) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    log.warn(
      "GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google sign-in is disabled"
    );
    // Register stub routes so the frontend doesn't 404; they explain what's missing.
    app.get("/api/auth/google", (_req, res) => {
      res.status(503).json({ message: "Google sign-in is not configured on this server." });
    });
    return;
  }

  const domains = (process.env.REPLIT_DOMAINS ?? "").split(",");
  // Use the first non-empty domain as the canonical callback host
  const primaryDomain = domains.find((d) => d.trim()) ?? "localhost:5000";
  const callbackURL = `https://${primaryDomain}/api/auth/google/callback`;

  log.info({ callbackURL }, "Registering Google OAuth strategy");

  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: clientId,
        clientSecret,
        callbackURL,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value ?? null;
          const firstName = profile.name?.givenName ?? null;
          const lastName = profile.name?.familyName ?? null;
          const profileImageUrl = profile.photos?.[0]?.value ?? null;

          // 1. Try to find by googleId (returning user)
          let user = await storage.getUserByGoogleId(googleId);

          if (!user && email) {
            // 2. Try to merge with an existing account that shares the same email
            const existing = await storage.getUserByEmail(email);
            if (existing) {
              user = await storage.linkGoogleId(existing.id, googleId);
            }
          }

          if (!user) {
            // 3. New user — generate a stable UUID-style ID
            const id = `google_${crypto.randomBytes(12).toString("hex")}`;
            user = await storage.upsertGoogleUser({
              id,
              googleId,
              email,
              firstName,
              lastName,
              profileImageUrl,
            });
          }

          // Attach minimal claims so isAuthenticated works unchanged
          const sessionUser: any = {
            claims: {
              sub: user.id,
              email: user.email,
              first_name: user.firstName,
              last_name: user.lastName,
            },
            // No Replit tokens — set a long-lived expiry so the middleware passes
            expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
            provider: "google",
          };

          done(null, sessionUser);
        } catch (err) {
          log.error({ err }, "Google OAuth verify error");
          done(err as Error);
        }
      }
    )
  );

  // ── Routes ────────────────────────────────────────────────────────────────

  app.get("/api/auth/google", (req, res, next) => {
    const returnTo = req.query.returnTo as string | undefined;
    if (returnTo) req.session.returnTo = returnTo;
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/api/login" }),
    (req: any, res) => {
      // Regenerate session to prevent fixation, then log the user in
      const user = req.user;
      const returnTo = req.session.returnTo;

      req.session.regenerate((regenErr: any) => {
        if (regenErr) {
          log.error({ err: regenErr }, "Session regeneration error");
          return res.redirect("/");
        }

        req.logIn(user, (loginErr: any) => {
          if (loginErr) {
            log.error({ err: loginErr }, "Google login error");
            return res.redirect("/");
          }

          req.session.save((saveErr: any) => {
            if (saveErr) log.error({ err: saveErr }, "Session save error");
          });

          if (returnTo && returnTo.startsWith("/")) {
            return res.redirect(returnTo);
          }
          res.redirect("/");
        });
      });
    }
  );
}
