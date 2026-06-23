export interface Task {
  id: string;
  title: string;
  project: string;
  nextStep?: string;
  score: number;
  duration: string;
  cognitiveLoad: string;
  completed: boolean;
  explanation?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  project: string;
  progress: number;
  targetDate?: string;
  metric?: string;
}

export interface ScheduleItem {
  id: string;
  time: string; // e.g. "09:00", "11:00"
  title: string;
  subtitle: string;
  completed: boolean;
  isNow?: boolean;
}

export interface DailyInsight {
  date: string;
  deepWorkMins: number;
  activeRestMins: number;
  cognitiveCapacity: number; // 0-100%
  completedTasks: number;
}
