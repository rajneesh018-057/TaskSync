import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-in-production";

// Register Route
router.post("/register", async (req: any, res: any) => {
  try {
    const { email, password, userName } = req.body;

    if (!email || !password || !userName) {
      return res.status(400).json({ error: "Email, password, and username are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        userName
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, userName: user.userName },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        profilePic: user.profilePic
      }
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

// Login Route
router.post("/login", async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: "This account uses Google Login. Please sign in with Google." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, userName: user.userName },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        profilePic: user.profilePic
      }
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Failed to login" });
  }
});

// Get Current User Profile Route
router.get("/me", authenticateJWT as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        userName: true,
        profilePic: true,
        createdAt: true
      }
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
  } catch (error: any) {
    console.error("Auth me error:", error);
    return res.status(500).json({ error: "Failed to fetch user context" });
  }
});

// Update User Profile Route
router.put("/profile", authenticateJWT as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = req.user.id;
    const { userName, email, profilePic } = req.body;

    if (!userName) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Check if email already in use by another user
    if (email && email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser) {
        return res.status(400).json({ error: "Email is already in use by another account" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        userName,
        email: email || undefined,
        profilePic: profilePic !== undefined ? profilePic : undefined
      },
      select: {
        id: true,
        email: true,
        userName: true,
        profilePic: true
      }
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ error: "Failed to update profile settings" });
  }
});

// ==========================================
// GOOGLE OAUTH ENDPOINTS
// ==========================================

const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5050/api/auth/google/callback";

// 1. Redirect to Google's OAuth consent screen
router.get("/google", (req: any, res: any) => {
  const { flow, userId } = req.query;

  // Dynamically detect client host from referer (defaults to localhost:5173)
  let clientHost = "localhost:5173";
  const referer = req.headers.referer;
  if (referer) {
    try {
      const url = new URL(referer);
      clientHost = url.host; // e.g. "localhost:5174"
    } catch (_) {}
  }

  const state = flow === "calendar" ? `calendar_${userId}_${clientHost}` : `login_${clientHost}`;

  const scopes = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/calendar.events"
  ];

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `response_type=code` +
    `&client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scopes.join(" "))}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${state}`;

  return res.redirect(authUrl);
});

// 2. Google OAuth Callback
router.get("/google/callback", async (req: any, res: any) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code is missing");
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code"
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Token exchange failed:", errText);
      return res.status(500).send(`Failed to exchange authorization code for tokens: ${errText}`);
    }

    const tokens = await tokenResponse.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      id_token?: string;
    };

    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Fetch user profile info
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!profileResponse.ok) {
      return res.status(500).send("Failed to retrieve user profile from Google");
    }

    const profile = await profileResponse.json() as {
      sub: string;
      email: string;
      name: string;
      picture?: string;
    };

    // Parse flow and client URL from state parameter
    const stateStr = (state as string) || "";
    let clientHost = "localhost:5173";
    let parsedFlow = "login";
    let parsedUserId = "";

    const stateParts = stateStr.split("_");
    if (stateParts[0] === "calendar") {
      parsedFlow = "calendar";
      parsedUserId = stateParts[1] || "";
      if (stateParts[2]) {
        clientHost = stateParts[2];
      }
    } else if (stateParts[0] === "login") {
      parsedFlow = "login";
      if (stateParts[1]) {
        clientHost = stateParts[1];
      }
    } else {
      if (stateStr.startsWith("calendar_")) {
        parsedFlow = "calendar";
        parsedUserId = stateStr.split("_")[1] || "";
      }
    }

    const protocol = clientHost.includes("localhost") ? "http" : "https";
    const clientUrl = `${protocol}://${clientHost}`;

    if (parsedFlow === "login") {
      let user = await prisma.user.findUnique({
        where: { email: profile.email }
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: profile.sub,
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token || user.googleRefreshToken,
            googleTokenExpiry: tokenExpiry,
            profilePic: user.profilePic || profile.picture || null
          }
        });
      } else {
        user = await prisma.user.create({
          data: {
            email: profile.email,
            userName: profile.name || profile.email.split("@")[0],
            googleId: profile.sub,
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token || null,
            googleTokenExpiry: tokenExpiry,
            profilePic: profile.picture || null
          }
        });
      }

      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, userName: user.userName },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const redirectUrl = `${clientUrl}/?token=${jwtToken}&id=${user.id}&email=${encodeURIComponent(user.email)}&userName=${encodeURIComponent(user.userName)}&profilePic=${encodeURIComponent(user.profilePic || "")}`;
      return res.redirect(redirectUrl);
    } else if (parsedFlow === "calendar") {
      const user = await prisma.user.findUnique({
        where: { id: parsedUserId }
      });

      if (!user) {
        return res.status(404).send("User not found for calendar linking");
      }

      await prisma.user.update({
        where: { id: parsedUserId },
        data: {
          googleId: profile.sub,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token || user.googleRefreshToken,
          googleTokenExpiry: tokenExpiry
        }
      });

      const redirectUrl = `${clientUrl}/planner?calendarConnected=true`;
      return res.redirect(redirectUrl);
    } else {
      return res.status(400).send("Invalid OAuth state parameter");
    }
  } catch (err: any) {
    console.error("Google Callback Error:", err);
    return res.status(500).send(`Google callback processing failed: ${err.message || err}`);
  }
});

export default router;
