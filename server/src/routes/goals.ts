import { Router, Response } from "express";
import prisma from "../db";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";
import { cacheMiddleware, invalidateUserCache } from "../middleware/cache";

const router = Router();

// Protect all goal endpoints with JWT authentication
router.use(authenticateJWT as any);

/**
 * GET /api/goals
 * Cached in Redis for 120s per user
 */
router.get(
  "/",
  cacheMiddleware(120, (req) => `cache:goals:${(req as any).user?.id || "anon"}`),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const goals = await prisma.goal.findMany({
        where: { userId: req.user!.id },
      });
      return res.json(goals);
    } catch (error) {
      console.error("Fetch goals error:", error);
      return res.status(500).json({ error: "Failed to fetch goals" });
    }
  }
);

/**
 * POST /api/goals
 * Creates a new goal and invalidates cache
 */
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, name, project, progress, targetDate, metric } = req.body;

    if (!id || !name || !project) {
      return res.status(400).json({ error: "ID, name, and project are required" });
    }

    const goal = await prisma.goal.create({
      data: {
        id,
        name,
        project,
        progress: Number(progress) || 0,
        targetDate: targetDate || null,
        metric: metric || null,
        userId,
      },
    });

    await invalidateUserCache(userId);
    return res.status(201).json(goal);
  } catch (error) {
    console.error("Create goal error:", error);
    return res.status(500).json({ error: "Failed to create goal" });
  }
});

/**
 * PUT /api/goals/:id
 * Updates goal details and invalidates cache
 */
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, project, progress, targetDate, metric } = req.body;

    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!existingGoal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(project !== undefined && { project }),
        ...(progress !== undefined && { progress: Number(progress) }),
        ...(targetDate !== undefined && { targetDate }),
        ...(metric !== undefined && { metric }),
      },
    });

    await invalidateUserCache(userId);
    return res.json(updatedGoal);
  } catch (error) {
    console.error("Update goal error:", error);
    return res.status(500).json({ error: "Failed to update goal" });
  }
});

/**
 * DELETE /api/goals/:id
 * Deletes a goal and flushes cache
 */
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!existingGoal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    await prisma.goal.delete({ where: { id } });
    await invalidateUserCache(userId);
    return res.json({ success: true, message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Delete goal error:", error);
    return res.status(500).json({ error: "Failed to delete goal" });
  }
});

/**
 * POST /api/goals/sync
 * Bulk synchronization for goals
 */
router.post("/sync", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { goals } = req.body;

    if (!Array.isArray(goals)) {
      return res.status(400).json({ error: "Goals array is required" });
    }

    const incomingIds = goals.map((goal: any) => goal.id);

    await prisma.$transaction([
      prisma.goal.deleteMany({
        where: {
          userId,
          id: { notIn: incomingIds },
        },
      }),
      ...goals.map((goal: any) =>
        prisma.goal.upsert({
          where: { id: goal.id },
          update: {
            name: goal.name,
            project: goal.project,
            progress: Number(goal.progress) || 0,
            targetDate: goal.targetDate,
            metric: goal.metric,
            userId,
          },
          create: {
            id: goal.id,
            name: goal.name,
            project: goal.project,
            progress: Number(goal.progress) || 0,
            targetDate: goal.targetDate,
            metric: goal.metric,
            userId,
          },
        })
      ),
    ]);

    await invalidateUserCache(userId);

    const updatedGoals = await prisma.goal.findMany({
      where: { userId },
    });

    return res.json(updatedGoals);
  } catch (error) {
    console.error("Sync goals error:", error);
    return res.status(500).json({ error: "Failed to sync goals" });
  }
});

export default router;
