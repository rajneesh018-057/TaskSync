import { Router, Response } from "express";
import prisma from "../db";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Apply auth middleware to all routes in this router
router.use(authenticateJWT as any);

// ==========================================
// TASKS ENDPOINTS
// ==========================================

// Get all tasks
router.get("/tasks", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    return res.json(tasks);
  } catch (error) {
    console.error("Fetch tasks error:", error);
    return res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Create task
router.post("/tasks", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, title, project, nextStep, score, duration, cognitiveLoad, completed, explanation } = req.body;

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
        userId
      }
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ error: "Failed to create task" });
  }
});

// Update task
router.put("/tasks/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, project, nextStep, score, duration, cognitiveLoad, completed, explanation } = req.body;

    // Verify task ownership
    const existingTask = await prisma.task.findFirst({
      where: { id, userId }
    });

    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingTask.title,
        project: project !== undefined ? project : existingTask.project,
        nextStep: nextStep !== undefined ? nextStep : existingTask.nextStep,
        score: score !== undefined ? Number(score) : existingTask.score,
        duration: duration !== undefined ? duration : existingTask.duration,
        cognitiveLoad: cognitiveLoad !== undefined ? cognitiveLoad : existingTask.cognitiveLoad,
        completed: completed !== undefined ? !!completed : existingTask.completed,
        explanation: explanation !== undefined ? explanation : existingTask.explanation
      }
    });

    return res.json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({ error: "Failed to update task" });
  }
});

// Delete task
router.delete("/tasks/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existingTask = await prisma.task.findFirst({
      where: { id, userId }
    });

    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    await prisma.task.delete({
      where: { id }
    });

    return res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({ error: "Failed to delete task" });
  }
});

// Sync/Upsert all tasks (for bulk updates)
router.post("/tasks/sync", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { tasks } = req.body; // Array of tasks

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: "Tasks array is required for sync" });
    }

    const incomingIds = tasks.map((task: any) => task.id);

    // Wrap in a transaction to delete removed tasks and upsert all active tasks in a single batch
    await prisma.$transaction([
      prisma.task.deleteMany({
        where: {
          userId,
          id: { notIn: incomingIds }
        }
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
            userId
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
            userId
          }
        })
      )
    ]);

    const updatedTasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    return res.json(updatedTasks);
  } catch (error) {
    console.error("Sync tasks error:", error);
    return res.status(500).json({ error: "Failed to sync tasks" });
  }
});

// ==========================================
// GOALS ENDPOINTS
// ==========================================

// Get all goals
router.get("/goals", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const goals = await prisma.goal.findMany({
      where: { userId }
    });
    return res.json(goals);
  } catch (error) {
    console.error("Fetch goals error:", error);
    return res.status(500).json({ error: "Failed to fetch goals" });
  }
});

// Create goal
router.post("/goals", async (req: AuthenticatedRequest, res: Response) => {
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
        userId
      }
    });

    return res.status(201).json(goal);
  } catch (error) {
    console.error("Create goal error:", error);
    return res.status(500).json({ error: "Failed to create goal" });
  }
});

// Update goal
router.put("/goals/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, project, progress, targetDate, metric } = req.body;

    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!existingGoal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingGoal.name,
        project: project !== undefined ? project : existingGoal.project,
        progress: progress !== undefined ? Number(progress) : existingGoal.progress,
        targetDate: targetDate !== undefined ? targetDate : existingGoal.targetDate,
        metric: metric !== undefined ? metric : existingGoal.metric
      }
    });

    return res.json(updatedGoal);
  } catch (error) {
    console.error("Update goal error:", error);
    return res.status(500).json({ error: "Failed to update goal" });
  }
});

// Delete goal
router.delete("/goals/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!existingGoal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    await prisma.goal.delete({
      where: { id }
    });

    return res.json({ success: true, message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Delete goal error:", error);
    return res.status(500).json({ error: "Failed to delete goal" });
  }
});

// Sync/Upsert all goals
router.post("/goals/sync", async (req: AuthenticatedRequest, res: Response) => {
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
          id: { notIn: incomingIds }
        }
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
            userId
          },
          create: {
            id: goal.id,
            name: goal.name,
            project: goal.project,
            progress: Number(goal.progress) || 0,
            targetDate: goal.targetDate,
            metric: goal.metric,
            userId
          }
        })
      )
    ]);

    const updatedGoals = await prisma.goal.findMany({
      where: { userId }
    });

    return res.json(updatedGoals);
  } catch (error) {
    console.error("Sync goals error:", error);
    return res.status(500).json({ error: "Failed to sync goals" });
  }
});

// ==========================================
// SCHEDULE ITEMS ENDPOINTS
// ==========================================

// Get all schedule items
router.get("/schedule", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const schedule = await prisma.scheduleItem.findMany({
      where: { userId }
    });
    return res.json(schedule);
  } catch (error) {
    console.error("Fetch schedule error:", error);
    return res.status(500).json({ error: "Failed to fetch schedule items" });
  }
});

// Create schedule item
router.post("/schedule", async (req: AuthenticatedRequest, res: Response) => {
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
        userId
      }
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error("Create schedule item error:", error);
    return res.status(500).json({ error: "Failed to create schedule item" });
  }
});

// Update schedule item
router.put("/schedule/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, time, subtitle, completed, isNow } = req.body;

    const existingItem = await prisma.scheduleItem.findFirst({
      where: { id, userId }
    });

    if (!existingItem) {
      return res.status(404).json({ error: "Schedule item not found" });
    }

    const updatedItem = await prisma.scheduleItem.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingItem.title,
        time: time !== undefined ? time : existingItem.time,
        subtitle: subtitle !== undefined ? subtitle : existingItem.subtitle,
        completed: completed !== undefined ? !!completed : existingItem.completed,
        isNow: isNow !== undefined ? !!isNow : existingItem.isNow
      }
    });

    return res.json(updatedItem);
  } catch (error) {
    console.error("Update schedule item error:", error);
    return res.status(500).json({ error: "Failed to update schedule item" });
  }
});

// Delete schedule item
router.delete("/schedule/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existingItem = await prisma.scheduleItem.findFirst({
      where: { id, userId }
    });

    if (!existingItem) {
      return res.status(404).json({ error: "Schedule item not found" });
    }

    await prisma.scheduleItem.delete({
      where: { id }
    });

    return res.json({ success: true, message: "Schedule item deleted successfully" });
  } catch (error) {
    console.error("Delete schedule item error:", error);
    return res.status(500).json({ error: "Failed to delete schedule item" });
  }
});

// Sync/Upsert all schedule items
router.post("/schedule/sync", async (req: AuthenticatedRequest, res: Response) => {
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
          id: { notIn: incomingIds }
        }
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
            userId
          },
          create: {
            id: item.id,
            title: item.title,
            time: item.time,
            subtitle: item.subtitle || "",
            completed: !!item.completed,
            isNow: !!item.isNow,
            userId
          }
        })
      )
    ]);

    const updatedSchedule = await prisma.scheduleItem.findMany({
      where: { userId }
    });

    return res.json(updatedSchedule);
  } catch (error) {
    console.error("Sync schedule error:", error);
    return res.status(500).json({ error: "Failed to sync schedule items" });
  }
});

export default router;
