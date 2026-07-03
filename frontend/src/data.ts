import { Task, Goal, ScheduleItem, DailyInsight } from "./types";

export const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Check off this first task!",
    project: "Getting Started",
    nextStep: "Click the checkbox to complete it",
    score: 95,
    duration: "1m",
    cognitiveLoad: "Low Stress Restorative",
    completed: false,
    explanation: "Easiest win of your day. Doing this will trigger your first dose of digital dopamine.",
    createdAt: new Date().toISOString()
  },
  {
    id: "task-2",
    title: "Define a personal goal in the Goals tab",
    project: "Getting Started",
    nextStep: "Navigate to Goals and add a new goal",
    score: 85,
    duration: "5m",
    cognitiveLoad: "Low Stress Restorative",
    completed: false,
    explanation: "Goals give your tasks purpose. Add something you actually want to achieve, like 'Learn to cook pasta' or 'Survive this week'.",
    createdAt: new Date().toISOString()
  },
  {
    id: "task-3",
    title: "Start a 90-minute Deep Focus block",
    project: "Onboarding",
    nextStep: "Set the focus timer to 90m and click start",
    score: 75,
    duration: "1h 30m",
    cognitiveLoad: "High Peak Cognitive Load",
    completed: false,
    explanation: "Trigger the focus timer on the dashboard to enter deep work mode. Put your phone in another room or face down.",
    createdAt: new Date().toISOString()
  }
];

export const initialGoals: Goal[] = [
  {
    id: "goal-1",
    name: "Organize My Life",
    project: "Getting Started",
    progress: 33,
    targetDate: "2026-07-31",
    metric: "Complete all onboarding tasks"
  },
  {
    id: "goal-2",
    name: "Master Deep Focus",
    project: "Onboarding",
    progress: 0,
    targetDate: "2026-08-15",
    metric: "Complete 5 focus blocks"
  }
];

export const initialSchedule: ScheduleItem[] = [
  {
    id: "sched-1",
    time: "09:00",
    title: "Morning Planning Ritual",
    subtitle: "Look at your dashboard and sip some coffee",
    completed: true
  },
  {
    id: "sched-2",
    time: "10:30",
    title: "NOW: DEEP FOCUS INTERVAL",
    subtitle: "Time to tackle your 'Getting Started' tasks!",
    completed: false,
    isNow: true
  },
  {
    id: "sched-3",
    time: "12:00",
    title: "Mandatory Do-Nothing Break",
    subtitle: "Active rest block: stand up, stretch, walk around",
    completed: false
  },
  {
    id: "sched-4",
    time: "15:00",
    title: "Inbox Triage Session",
    subtitle: "Type or speak your thoughts into the triage box",
    completed: false
  }
];

export const initialInsights: DailyInsight[] = [
  { date: "Mon", deepWorkMins: 0, activeRestMins: 0, cognitiveCapacity: 100, completedTasks: 0 },
  { date: "Tue", deepWorkMins: 0, activeRestMins: 0, cognitiveCapacity: 100, completedTasks: 0 },
  { date: "Wed", deepWorkMins: 0, activeRestMins: 0, cognitiveCapacity: 100, completedTasks: 0 },
  { date: "Thu", deepWorkMins: 0, activeRestMins: 0, cognitiveCapacity: 100, completedTasks: 0 },
  { date: "Fri", deepWorkMins: 0, activeRestMins: 0, cognitiveCapacity: 100, completedTasks: 0 },
  { date: "Sat", deepWorkMins: 0, activeRestMins: 0, cognitiveCapacity: 100, completedTasks: 0 },
  { date: "Sun", deepWorkMins: 0, activeRestMins: 0, cognitiveCapacity: 100, completedTasks: 0 }
];

