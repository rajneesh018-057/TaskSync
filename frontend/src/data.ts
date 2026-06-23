import { Task, Goal, ScheduleItem, DailyInsight } from "./types";

export const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Finalize Q3 Performance Review",
    project: "Management Essentials",
    nextStep: "Draft Feedback",
    score: 92,
    duration: "2h",
    cognitiveLoad: "High Peak Cognitive Load",
    completed: false,
    explanation: "High peak cognitive alignment requested. Strategic review requires deep concentration, structured thinking, and critical analysis of performance parameters. Best matched during peak cortisol levels in mid-morning.",
    createdAt: new Date().toISOString()
  },
  {
    id: "task-2",
    title: "Weekly Research Synthesis",
    project: "UX Audit",
    nextStep: "Review Figjam",
    score: 78,
    duration: "45m",
    cognitiveLoad: "Medium Cognitive Load",
    completed: false,
    explanation: "This synthesis bridges design telemetry with upcoming development milestones. Moderately high cognitive load recommendation due to patterns identification in multi-source user inputs.",
    createdAt: new Date().toISOString()
  },
  {
    id: "task-3",
    title: "Organize Workspace Files",
    project: "General",
    nextStep: "Archive Q2",
    score: 45,
    duration: "20m",
    cognitiveLoad: "Low Stress Restorative",
    completed: false,
    explanation: "Administrative housekeeping requiring minimal focus depth. Best utilized as filler in transition spaces or at the end of productive sprints to ease executive fatigue.",
    createdAt: new Date().toISOString()
  }
];

export const initialGoals: Goal[] = [
  {
    id: "goal-1",
    name: "Complete Q3 Management Essentials",
    project: "Management Essentials",
    progress: 75,
    targetDate: "2026-07-15",
    metric: "3 key reviews finalized"
  },
  {
    id: "goal-2",
    name: "Perform UX Evaluation Audit",
    project: "UX Audit",
    progress: 40,
    targetDate: "2026-07-01",
    metric: "Synthesize 5 active study channels"
  },
  {
    id: "goal-3",
    name: "Declutter Digital Footprint",
    project: "General",
    progress: 25,
    targetDate: "2026-06-30",
    metric: "All archive operations updated"
  }
];

export const initialSchedule: ScheduleItem[] = [
  {
    id: "sched-1",
    time: "09:00",
    title: "Strategic Alignment Meeting",
    subtitle: "Google Meet • Zoom link attached",
    completed: false
  },
  {
    id: "sched-2",
    time: "10:30",
    title: "NOW: REVIEW FOCUS BLOCK",
    subtitle: "Strategic deep work interval active",
    completed: false,
    isNow: true
  },
  {
    id: "sched-3",
    time: "11:00",
    title: "Client Feedback Review",
    subtitle: "Design Studio",
    completed: true
  },
  {
    id: "sched-4",
    time: "13:00",
    title: "Creative Brainstorming",
    subtitle: "Conference Room B",
    completed: false
  },
  {
    id: "sched-5",
    time: "14:00",
    title: "Project Sync",
    subtitle: "Meeting Room A • Overlapping with deep focus block",
    completed: false
  }
];

export const initialInsights: DailyInsight[] = [
  { date: "Mon", deepWorkMins: 120, activeRestMins: 20, cognitiveCapacity: 85, completedTasks: 4 },
  { date: "Tue", deepWorkMins: 90, activeRestMins: 30, cognitiveCapacity: 78, completedTasks: 3 },
  { date: "Wed", deepWorkMins: 180, activeRestMins: 45, cognitiveCapacity: 92, completedTasks: 6 },
  { date: "Thu", deepWorkMins: 150, activeRestMins: 15, cognitiveCapacity: 80, completedTasks: 5 },
  { date: "Fri", deepWorkMins: 60, activeRestMins: 60, cognitiveCapacity: 95, completedTasks: 2 },
  { date: "Sat", deepWorkMins: 45, activeRestMins: 90, cognitiveCapacity: 99, completedTasks: 1 },
  { date: "Sun", deepWorkMins: 90, activeRestMins: 40, cognitiveCapacity: 88, completedTasks: 3 }
];
