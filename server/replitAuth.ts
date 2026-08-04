import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import crypto from "crypto";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { createLogger } from "./logger";

const log = createLogger("auth");

// Extend session type
declare module "express-session" {
  interface SessionData {
    returnTo?: string;
    tokens?: { access_token: string | undefined; refresh_token: string | undefined; expires_at: number };
  }
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  const sessionSecret = process.env.SESSION_SECRET || "dev-secret-" + crypto.randomBytes(32).toString("hex");

  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
  req?: any
) {
  try {
    if (typeof tokens.claims === "function") {
      user.claims = tokens.claims();
    } else {
      user.claims = (tokens as any).claims || {};
    }
    // Store tokens on the session, NOT on the user object, to prevent
    // accidental token leakage through req.user serialization or logging.
    const tokenPayload = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: user.claims?.exp ?? Math.floor(Date.now() / 1000) + 3600,
    };
    if (req?.session) {
      req.session.tokens = tokenPayload;
    } else {
      // Fallback: attach to user only during initial verify before session exists
      user._tokens = tokenPayload;
    }
    user.expires_at = tokenPayload.expires_at;
  } catch (error) {
    log.error({ err: error }, "Error updating user session");
    user.claims = {};
    user.expires_at = Math.floor(Date.now() / 1000) + 3600;
  }
}

async function upsertUser(claims: any) {
  try {
    if (!claims["sub"]) {
      throw new Error("Missing required user ID (sub) in claims");
    }
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"] || null,
      firstName: claims["first_name"] || null,
      lastName: claims["last_name"] || null,
      profileImageUrl: claims["profile_image_url"] || null,
      role: "parent",
    });
  } catch (error) {
    log.error({ err: error }, "Error upserting user");
    throw error;
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const user = {};
      updateUserSession(user, tokens);

      let claims = {};
      try {
        if (typeof (tokens as any).claims === "function") {
          claims = (tokens as any).claims();
        } else {
          claims = (tokens as any).claims || {};
        }

        log.debug({ claimKeys: Object.keys(claims) }, "Claims extracted");

        if (!claims || Object.keys(claims).length === 0) {
          log.warn("Claims are empty, using fallback");
          claims = {
            sub: "replit_user_" + Date.now(),
            email: "user@replit.com",
            first_name: "Replit",
            last_name: "User",
          };
        }
      } catch (error) {
        log.error({ err: error }, "Error getting claims");
        return verified(new Error("Failed to get user claims from authentication token"));
      }

      await upsertUser(claims);
      verified(null, user);
    } catch (error) {
      log.error({ err: error }, "Authentication verification error");
      verified(error);
    }
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
        passReqToCallback: false,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const returnTo = req.query.returnTo as string;
    const domains = process.env.REPLIT_DOMAINS!.split(",");
    const currentDomain = req.hostname === "127.0.0.1" || req.hostname === "localhost" ? domains[0] : req.hostname;
    const strategyName = `replitauth:${currentDomain}`;

    log.debug({ returnTo, strategyName }, "Login initiated");

    if (returnTo) {
      req.session.returnTo = returnTo;
      req.session.save((err) => {
        if (err) log.error({ err }, "Session save error");
        passport.authenticate(strategyName, {
          prompt: "login consent",
          scope: ["openid", "email", "profile", "offline_access"],
        })(req, res, next);
      });
    } else {
      passport.authenticate(strategyName, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    }
  });

  app.get("/api/callback", (req, res, next) => {
    const domains = process.env.REPLIT_DOMAINS!.split(",");
    const currentDomain = req.hostname === "127.0.0.1" || req.hostname === "localhost" ? domains[0] : req.hostname;
    const strategyName = `replitauth:${currentDomain}`;

    passport.authenticate(strategyName, (err: any, user: any) => {
      if (err) {
        log.error({ err }, "Authentication error");
        return next(err);
      }
      if (!user) {
        log.warn("No user returned from authentication");
        return res.redirect("/api/login");
      }

      // Capture returnTo before regenerating the session (regenerate clears session data)
      const returnTo = req.session.returnTo;

      // Regenerate session ID before attaching identity to prevent session fixation attacks
      req.session.regenerate((regenErr) => {
        if (regenErr) {
          log.error({ err: regenErr }, "Session regeneration error");
          return next(regenErr);
        }

        req.logIn(user, (loginErr) => {
          if (loginErr) {
            log.error({ err: loginErr }, "Login error");
            return next(loginErr);
          }

          // Move tokens from user object onto the session so they are never
          // serialized into req.user or exposed through logging/serialization.
          if ((user as any)._tokens) {
            req.session.tokens = (user as any)._tokens;
            delete (user as any)._tokens;
          }

          log.debug({ returnTo, sessionId: req.sessionID }, "Callback session state");

          req.session.save((saveErr) => {
            if (saveErr) log.error({ err: saveErr }, "Error saving session after login");
          });

          if (returnTo && returnTo.startsWith("/")) {
            log.debug({ returnTo }, "Redirecting after login");
            return res.redirect(returnTo);
          }

          res.redirect("/");
        });
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  // Tokens live on the session (not req.user) to prevent accidental exposure
  const sessionTokens = (req.session as any).tokens as {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  } | undefined;

  const expiresAt = sessionTokens?.expires_at ?? user?.expires_at;

  if (!req.isAuthenticated() || !expiresAt) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= expiresAt) {
    return next();
  }

  const refreshToken = sessionTokens?.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    // Refresh tokens back onto the session (not user object)
    updateUserSession(user, tokenResponse, req);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
