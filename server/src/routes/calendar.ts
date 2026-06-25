import { Router, Response } from "express";
import prisma from "../db";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Function to refresh Google OAuth access token if expired
async function getOrRefreshGoogleAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || !user.googleRefreshToken) {
    return null;
  }

  const now = new Date();
  // If we have an access token and it has not expired yet (with a 5-minute buffer)
  if (user.googleAccessToken && user.googleTokenExpiry && new Date(user.googleTokenExpiry).getTime() > now.getTime() + 5 * 60 * 1000) {
    return user.googleAccessToken;
  }

  // Otherwise, refresh the access token
  console.log(`[Google Calendar] Access token expired or expiring soon for user ${userId}. Refreshing...`);
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: user.googleRefreshToken,
        grant_type: "refresh_token"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Google Calendar] Failed to refresh token for user ${userId}:`, errText);
      return null;
    }

    const data = await response.json() as {
      access_token: string;
      expires_in: number;
    };

    const newExpiry = new Date(Date.now() + data.expires_in * 1000);

    // Save back to DB
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: data.access_token,
        googleTokenExpiry: newExpiry
      }
    });

    console.log(`[Google Calendar] Access token refreshed successfully for user ${userId}`);
    return data.access_token;
  } catch (err) {
    console.error(`[Google Calendar] Token refresh error for user ${userId}:`, err);
    return null;
  }
}

// Get Google Calendar events
router.get("/events", authenticateJWT as any, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const accessToken = await getOrRefreshGoogleAccessToken(userId);
    if (!accessToken) {
      return res.status(400).json({ error: "Google Calendar not connected or session expired." });
    }

    // Default time range: from 7 days ago to 14 days in the future to capture surrounding context
    const timeMinQuery = req.query.timeMin as string;
    const timeMaxQuery = req.query.timeMax as string;

    const defaultMin = new Date();
    defaultMin.setDate(defaultMin.getDate() - 7);
    const defaultMax = new Date();
    defaultMax.setDate(defaultMax.getDate() + 14);

    const timeMin = timeMinQuery || defaultMin.toISOString();
    const timeMax = timeMaxQuery || defaultMax.toISOString();

    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${encodeURIComponent(timeMin)}` +
      `&timeMax=${encodeURIComponent(timeMax)}` +
      `&singleEvents=true` +
      `&orderBy=startTime` +
      `&maxResults=100`;

    const eventsResponse = await fetch(calendarUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!eventsResponse.ok) {
      const errText = await eventsResponse.text();
      console.error("[Google Calendar] Google API fetch events error:", errText);
      return res.status(eventsResponse.status).json({ error: `Failed to fetch events from Google: ${errText}` });
    }

    const data = (await eventsResponse.json()) as { items?: any[] };
    return res.json(data.items || []);
  } catch (error: any) {
    console.error("[Google Calendar] Endpoint error:", error);
    return res.status(500).json({ error: "Failed to fetch calendar events." });
  }
});

export default router;
