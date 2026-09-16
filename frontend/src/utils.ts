import { Task } from "./types";

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function calculateRiskLevel(tasks: Task[]): { level: "Low" | "Medium" | "High"; color: string } {
  const activeTasks = tasks.filter(t => !t.completed);
  
  if (activeTasks.length === 0) {
    return { level: "Low", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  }

  // The Weighted Sum Model Engine
  let totalCognitiveLoad = 0;

  for (const task of activeTasks) {
    // 1. Base Score
    let taskWeight = task.score > 0 ? task.score : 50; // Fallback weight

    // 2. Priority Multiplier
    let priorityMultiplier = 1.0;
    if (task.priority === 'HIGH') priorityMultiplier = 1.5;
    if (task.priority === 'LOW') priorityMultiplier = 0.5;

    // 3. Dynamic Urgency Escalation (Time Decay)
    let urgencyMultiplier = 1.0;

    // Edge Case Fix: Ignore routine tasks or tasks without strict deadlines
    if (!task.deadline || task.type === 'DAILY') {
        urgencyMultiplier = 1.0; 
    } else {
        const now = new Date();
        const deadlineDate = new Date(task.deadline);
        const hoursRemaining = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursRemaining <= 24) {
            urgencyMultiplier = 3.0; // Panic multiplier overrides low priority!
        } else if (hoursRemaining <= 72) {
            urgencyMultiplier = 1.5; // Warning multiplier
        }
    }

    totalCognitiveLoad += (taskWeight * priorityMultiplier * urgencyMultiplier);
  }

  // 4. Circuit Breaker Thresholds
  if (totalCognitiveLoad < 100) {
    return { level: "Low", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  } else if (totalCognitiveLoad < 300) {
    return { level: "Medium", color: "text-amber-600 bg-amber-50 border-amber-200" };
  } else {
    return { level: "High", color: "text-rose-600 bg-rose-50 border-rose-200 animate-pulse" };
  }
}
