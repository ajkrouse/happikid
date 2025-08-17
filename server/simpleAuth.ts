import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import crypto from "crypto";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

// Simple session store (in production, use Redis or database)
const sessions = new Map<string, { userId: string; expiresAt: number }>();

// Clean up expired sessions every hour
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000);

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createSession(userId: string): string {
  const sessionToken = generateSessionToken();
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
  
  sessions.set(sessionToken, { userId, expiresAt });
  return sessionToken;
}

export function getSessionUser(sessionToken: string): { userId: string } | null {
  const session = sessions.get(sessionToken);
  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(sessionToken);
    return null;
  }
  return { userId: session.userId };
}

export function deleteSession(sessionToken: string): void {
  sessions.delete(sessionToken);
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionToken = req.cookies?.session || req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const session = getSessionUser(sessionToken);
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(session.userId);
    if (!user) {
      deleteSession(sessionToken);
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionToken = req.cookies?.session || req.headers.authorization?.replace('Bearer ', '');
    
    if (sessionToken) {
      const session = getSessionUser(sessionToken);
      if (session) {
        const user = await storage.getUser(session.userId);
        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    next(); // Continue without auth
  }
};