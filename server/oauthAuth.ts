import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import appleSignin from 'apple-signin-auth';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Google OAuth Configuration
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const firstName = profile.name?.givenName;
      const lastName = profile.name?.familyName;
      const profileImageUrl = profile.photos?.[0]?.value;

      if (!email) {
        return done(new Error('No email provided by Google'), null);
      }

      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        user = await storage.upsertUser({
          id: `google_${profile.id}`,
          email,
          firstName,
          lastName,
          profileImageUrl
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Passport session serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export interface AuthenticatedRequest extends Express.Request {
  user?: User;
}

// Authentication middleware
export const requireOAuthAuth: RequestHandler = (req: AuthenticatedRequest, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

// Setup OAuth routes
export async function setupOAuthAuth(app: Express) {
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth routes
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get('/api/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/auth/error' }),
      (req, res) => {
        // Successful authentication
        res.redirect('/');
      }
    );
  }

  // Apple Sign In verification endpoint (for mobile apps)
  app.post('/api/auth/apple/verify', async (req, res) => {
    try {
      const { id_token, user: userInfo } = req.body;

      if (!process.env.APPLE_CLIENT_ID) {
        return res.status(500).json({ error: 'Apple Sign In not configured' });
      }

      // Verify the ID token
      const { sub: userAppleId, email } = await appleSignin.verifyIdToken(
        id_token,
        { audience: process.env.APPLE_CLIENT_ID }
      );

      let userData = { 
        appleId: userAppleId, 
        email: email || `${userAppleId}@privaterelay.appleid.com` // Apple private relay
      };

      // Apple only provides user details on first sign-in
      if (userInfo && userInfo.name) {
        userData.firstName = userInfo.name.firstName;
        userData.lastName = userInfo.name.lastName;
      }

      // Check if user exists or create new user
      let user = await storage.getUserByEmail(userData.email);
      
      if (!user) {
        user = await storage.upsertUser({
          id: `apple_${userAppleId}`,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName
        });
      }

      // Create session manually for Apple Sign In
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Session creation failed' });
        }
        res.json({ success: true, user });
      });

    } catch (error) {
      console.error('Apple Sign In verification failed:', error);
      res.status(401).json({ error: 'Invalid Apple ID token' });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', (req: AuthenticatedRequest, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  // Error page
  app.get('/auth/error', (req, res) => {
    res.status(401).json({ error: 'Authentication failed' });
  });
}