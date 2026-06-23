import { Task } from "./types";

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function calculateRiskLevel(tasks: Task[]): { level: "Low" | "Medium" | "High"; color: string } {
  const activeTasks = tasks.filter(t => !t.completed);
  const totalScore = activeTasks.reduce((sum, t) => sum + t.score, 0);
  
  if (totalScore === 0 || activeTasks.length <= 2) {
    return { level: "Low", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  } else if (activeTasks.length <= 4 && totalScore < 300) {
    return { level: "Medium", color: "text-amber-600 bg-amber-50 border-amber-200" };
  } else {
    return { level: "High", color: "text-rose-600 bg-rose-50 border-rose-200 animate-pulse" };
  }
}
