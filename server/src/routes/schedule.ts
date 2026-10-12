import { Router, Response } from "express";
import prisma from "../db";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";
import { cacheMiddleware, invalidateUserCache } from "../middleware/cache";

const router = Router();

// Protect all schedule endpoints with JWT authentication
router.use(authenticateJWT as any);

/**
 * GET /api/schedule
 * Cached in Redis for 120s per user
 */
router.get(
  "/",
  cacheMiddleware(120, (req) => `cache:schedule:${(req as any).user?.id || "anon"}`),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schedule = await prisma.scheduleItem.findMany({
        where: { userId: req.user!.id },
      });
      return res.json(schedule);
    } catch (error) {
      console.error("Fetch schedule error:", error);
      return res.status(500).json({ error: "Failed to fetch schedule items" });
    }
  }
);

/**
 * POST /api/schedule
 * Creates a new schedule item and invalidates cache
 */
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, title, time, subtitle, completed, isNow } = req.body;

    if (!id || !title || !time) {
      return res.status(400).json({ error: "ID, title, and time are required" });
    }

    const item = await prisma.scheduleItem.create({
      data: {
        id,
        title,
        time,
        subtitle: subtitle || "",
        completed: !!completed,
        isNow: !!isNow,
        userId,
      },
    });

    await invalidateUserCache(userId);
    return res.status(201).json(item);
  } catch (error) {
    console.error("Create schedule item error:", error);
    return res.status(500).json({ error: "Failed to create schedule item" });
  }
});

/**
 * PUT /api/schedule/:id
 * Updates schedule item and invalidates cache
 */
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, time, subtitle, completed, isNow } = req.body;

    const existingItem = await prisma.scheduleItem.findFirst({
      where: { id, userId },
    });

    if (!existingItem) {
      return res.status(404).json({ error: "Schedule item not found" });
    }

    const updatedItem = await prisma.scheduleItem.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(time !== undefined && { time }),
        ...(subtitle !== undefined && { subtitle }),
        ...(completed !== undefined && { completed: !!completed }),
        ...(isNow !== undefined && { isNow: !!isNow }),
      },
    });

    await invalidateUserCache(userId);
    return res.json(updatedItem);
  } catch (error) {
    console.error("Update schedule item error:", error);
    return res.status(500).json({ error: "Failed to update schedule item" });
  }
});

/**
 * DELETE /api/schedule/:id
 * Deletes schedule item and invalidates cache
 */
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existingItem = await prisma.scheduleItem.findFirst({
      where: { id, userId },
    });

    if (!existingItem) {
      return res.status(404).json({ error: "Schedule item not found" });
    }

    await prisma.scheduleItem.delete({ where: { id } });
    await invalidateUserCache(userId);
    return res.json({ success: true, message: "Schedule item deleted successfully" });
  } catch (error) {
    console.error("Delete schedule item error:", error);
    return res.status(500).json({ error: "Failed to delete schedule item" });
  }
});

/**
 * POST /api/schedule/sync
 * Bulk synchronization for schedule items
 */
router.post("/sync", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { schedule } = req.body;

    if (!Array.isArray(schedule)) {
      return res.status(400).json({ error: "Schedule array is required" });
    }

    const incomingIds = schedule.map((item: any) => item.id);

    await prisma.$transaction([
      prisma.scheduleItem.deleteMany({
        where: {
          userId,
          id: { notIn: incomingIds },
        },
      }),
      ...schedule.map((item: any) =>
        prisma.scheduleItem.upsert({
          where: { id: item.id },
          update: {
            title: item.title,
            time: item.time,
            subtitle: item.subtitle || "",
            completed: !!item.completed,
            isNow: !!item.isNow,
            userId,
          },
          create: {
            id: item.id,
            title: item.title,
            time: item.time,
            subtitle: item.subtitle || "",
            completed: !!item.completed,
            isNow: !!item.isNow,
            userId,
          },
        })
      ),
    ]);

    await invalidateUserCache(userId);

    const updatedSchedule = await prisma.scheduleItem.findMany({
      where: { userId },
    });

    return res.json(updatedSchedule);
  } catch (error) {
    console.error("Sync schedule error:", error);
    return res.status(500).json({ error: "Failed to sync schedule items" });
  }
});

export default router;
