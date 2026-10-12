import { Router, Response } from "express";
import prisma from "../db";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";
import { cacheMiddleware, invalidateUserCache } from "../middleware/cache";

const router = Router();

// Protect all task endpoints with JWT authentication
router.use(authenticateJWT as any);

/**
 * GET /api/tasks
 * Cached in Redis for 120s per user
 */
router.get(
  "/",
  cacheMiddleware(120, (req) => `cache:tasks:${(req as any).user?.id || "anon"}`),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tasks = await prisma.task.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
      });
      return res.json(tasks);
    } catch (error) {
      console.error("Fetch tasks error:", error);
      return res.status(500).json({ error: "Failed to fetch tasks" });
    }
  }
);

/**
 * POST /api/tasks
 * Creates a new task and invalidates cached task queries
 */
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      id,
      title,
      project,
      nextStep,
      score,
      duration,
      cognitiveLoad,
      completed,
      explanation,
      deadline,
      priority,
      type,
    } = req.body;

    if (!id || !title || !project) {
      return res.status(400).json({ error: "ID, title, and project are required" });
    }

    const task = await prisma.task.create({
      data: {
        id,
        title,
        project,
        nextStep: nextStep || null,
        score: Number(score) || 50,
        duration: duration || "30m",
        cognitiveLoad: cognitiveLoad || "Medium Cognitive Load",
        completed: !!completed,
        explanation: explanation || null,
        deadline: deadline ? new Date(deadline) : null,
        priority: priority || "MEDIUM",
        type: type || "DAILY",
        userId,
      },
    });

    await invalidateUserCache(userId);
    return res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ error: "Failed to create task" });
  }
});

/**
 * PUT /api/tasks/:id
 * Updates task fields and invalidates cache
 */
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      title,
      project,
      nextStep,
      score,
      duration,
      cognitiveLoad,
      completed,
      explanation,
      deadline,
      priority,
      type,
    } = req.body;

    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(project !== undefined && { project }),
        ...(nextStep !== undefined && { nextStep }),
        ...(score !== undefined && { score: Number(score) }),
        ...(duration !== undefined && { duration }),
        ...(cognitiveLoad !== undefined && { cognitiveLoad }),
        ...(completed !== undefined && { completed: !!completed }),
        ...(explanation !== undefined && { explanation }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(priority !== undefined && { priority }),
        ...(type !== undefined && { type }),
      },
    });

    await invalidateUserCache(userId);
    return res.json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({ error: "Failed to update task" });
  }
});

/**
 * DELETE /api/tasks/:id
 * Removes a task and invalidates user cache
 */
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    await prisma.task.delete({ where: { id } });
    await invalidateUserCache(userId);
    return res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({ error: "Failed to delete task" });
  }
});

/**
 * POST /api/tasks/sync
 * Bulk upsert and synchronization for task list
 */
router.post("/sync", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: "Tasks array is required for sync" });
    }

    const incomingIds = tasks.map((task: any) => task.id);

    await prisma.$transaction([
      prisma.task.deleteMany({
        where: {
          userId,
          id: { notIn: incomingIds },
        },
      }),
      ...tasks.map((task: any) =>
        prisma.task.upsert({
          where: { id: task.id },
          update: {
            title: task.title,
            project: task.project,
            nextStep: task.nextStep,
            score: Number(task.score) || 50,
            duration: task.duration,
            cognitiveLoad: task.cognitiveLoad,
            completed: !!task.completed,
            explanation: task.explanation,
            deadline: task.deadline ? new Date(task.deadline) : null,
            priority: task.priority || "MEDIUM",
            type: task.type || "DAILY",
            userId,
          },
          create: {
            id: task.id,
            title: task.title,
            project: task.project,
            nextStep: task.nextStep,
            score: Number(task.score) || 50,
            duration: task.duration,
            cognitiveLoad: task.cognitiveLoad,
            completed: !!task.completed,
            explanation: task.explanation,
            deadline: task.deadline ? new Date(task.deadline) : null,
            priority: task.priority || "MEDIUM",
            type: task.type || "DAILY",
            userId,
          },
        })
      ),
    ]);

    await invalidateUserCache(userId);

    const updatedTasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json(updatedTasks);
  } catch (error) {
    console.error("Sync tasks error:", error);
    return res.status(500).json({ error: "Failed to sync tasks" });
  }
});

export default router;
