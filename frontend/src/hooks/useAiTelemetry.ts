import { useState, useEffect, useRef } from "react";
import { Task, Goal, ScheduleItem, DailyInsight } from "../types";
import { initialInsights } from "../data";

interface UseAiTelemetryProps {
  token: string | null;
  tasks: Task[];
  goals: Goal[];
  schedule: ScheduleItem[];
}

export function useAiTelemetry({ token, tasks, goals, schedule }: UseAiTelemetryProps) {
  const [aiAdvice, setAiAdvice] = useState<{
    suggestion: string;
    predictedLoad: string;
    alignmentScore: number;
    loading: boolean;
  }>({
    suggestion: "I'm watching you. Literally. Add some tasks or start a focus block before I start sending judgment signals to your router.",
    predictedLoad: "Koala-Level Brain Idle",
    alignmentScore: 100,
    loading: false
  });

  const [cognitiveInsights, setCognitiveInsights] = useState<{
    focusDiagnostic: string;
    restAssessment: string;
    cognitiveCapacity: number;
    loading: boolean;
  }>({
    focusDiagnostic: "Your brain is currently in a state of absolute tranquility, mostly because you haven't done any hard work yet. Let's fix that.",
    restAssessment: "Rest buffers are currently 100% since no physical or mental effort has been detected. Stop resting from your rest.",
    cognitiveCapacity: 100,
    loading: false
  });

  const lastFetchTimeRef = useRef<number>(0);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Request alignment counselor recommendation on load / task edit
  const fetchAiAdvice = () => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    const now = Date.now();
    const minInterval = 10000; // 10 seconds limit between calls to Gemini API
    const timeSinceLastFetch = now - lastFetchTimeRef.current;

    const performFetch = async () => {
      lastFetchTimeRef.current = Date.now();
      setAiAdvice(prev => ({ ...prev, loading: true }));
      try {
        const headers: any = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const response = await fetch("/api/suggest-alignment", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tasks: tasks.filter(t => !t.completed),
            goals: goals,
            timeOfDay: new Date().getHours() < 12 ? "morning" : "afternoon"
          })
        });
        if (response.ok) {
          const data = await response.json();
          setAiAdvice({
            suggestion: data.suggestion,
            predictedLoad: data.predictedLoad,
            alignmentScore: data.alignmentScore,
            loading: false
          });
        } else {
          throw new Error("Failed to reach counseling API");
        }
      } catch (err) {
        console.warn("AI counsel fallback activated:", err);
        const funnySuggestions = [
          `AI predicts a 99% chance that you are currently avoiding "${tasks[0]?.title || "your responsibilities"}". Every second you stare at me is a second you could have spent finishing it.`,
          `Your top task is "${tasks[0]?.title || "doing something productive"}". Working on it now is scientifically proven to be 400% more effective than crying about it later.`,
          `You have ${tasks.length} pending tasks. If you don't start a focus block right now, I'm going to start generating louder and more aggressive reminders.`,
          `WARNING: Cognitive load is currently in 'potato mode'. Let's activate a focus block to get some synapses firing!`
        ];
        const randomSuggestion = tasks.length > 0 
          ? funnySuggestions[Math.floor(Math.random() * funnySuggestions.length)]
          : "Your task list is cleaner than my source code. Add some tasks before I start questioning why I was compiled.";

        setAiAdvice({
          suggestion: randomSuggestion,
          predictedLoad: tasks.length > 3 ? "Hyper-Extended Panic Load" : (tasks.length > 0 ? "Medium Cognitive Effort" : "Koala-Level Brain Idle"),
          alignmentScore: tasks.length > 0 ? Math.min(100, Math.max(10, 100 - tasks.length * 15)) : 100,
          loading: false
        });
      }
    };

    if (timeSinceLastFetch < minInterval) {
      fetchTimeoutRef.current = setTimeout(performFetch, minInterval - timeSinceLastFetch);
    } else {
      performFetch();
    }
  };

  useEffect(() => {
    fetchAiAdvice();
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [tasks.length]);

  // Fetch dynamic AI telemetry insights
  const fetchCognitiveInsights = async () => {
    setCognitiveInsights(prev => ({ ...prev, loading: true }));
    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/insights", {
        method: "POST",
        headers,
        body: JSON.stringify({
          tasks: tasks.map(t => ({
            title: t.title,
            project: t.project,
            score: t.score,
            duration: t.duration,
            cognitiveLoad: t.cognitiveLoad,
            completed: t.completed
          })),
          goals: goals,
          schedule: schedule
        })
      });
      if (response.ok) {
        const data = await response.json();
        setCognitiveInsights({
          focusDiagnostic: data.focusDiagnostic,
          restAssessment: data.restAssessment,
          cognitiveCapacity: data.cognitiveCapacity || 80,
          loading: false
        });
      } else {
        throw new Error("Failed to fetch insights");
      }
    } catch (err) {
      console.warn("AI insights fallback activated:", err);
      const pendingTasksCount = tasks.filter(t => !t.completed).length;
      const completedTasksCount = tasks.filter(t => t.completed).length;
      let focusDiagnostic = "Your brain is currently in a state of absolute tranquility, mostly because you haven't done any hard work yet. Let's fix that.";
      if (completedTasksCount > 0) {
        focusDiagnostic = `You completed ${completedTasksCount} task(s)! Your single working brain cell deserves a gold star. Keep going before the momentum completely vanishes.`;
      } else if (pendingTasksCount > 0) {
        focusDiagnostic = `You have ${pendingTasksCount} tasks pending. AI analysis indicates high levels of active procrastination and screen-staring.`;
      }

      let restAssessment = "Rest buffers are currently 100% since no physical or mental effort has been detected. Stop resting from your rest.";
      if (pendingTasksCount > 4) {
        restAssessment = `You have ${pendingTasksCount} pending tasks. Attempting to rest now is legally classified as avoidance. Close the browser tabs and do one task.`;
      } else if (completedTasksCount > 0) {
        restAssessment = "Buffer intervals are stable. You may take a 5-minute coffee break, but I'm timing you. Don't get comfortable.";
      }

      setCognitiveInsights({
        focusDiagnostic,
        restAssessment,
        cognitiveCapacity: Math.max(10, 100 - pendingTasksCount * 15),
        loading: false
      });
    }
  };

  const getDynamicInsights = (): DailyInsight[] => {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const currentDayName = daysOfWeek[new Date().getDay()];

    let todayDeepMins = 0;
    let todayCompletedCount = 0;
    tasks.forEach(t => {
      if (t.completed) {
        todayCompletedCount++;
        const match = t.duration.match(/(\d+)\s*(h|m)/);
        if (match) {
          const val = parseInt(match[1]);
          const unit = match[2];
          todayDeepMins += unit === "h" ? val * 60 : val;
        } else {
          todayDeepMins += 30;
        }
      }
    });

    if (todayDeepMins === 0 && todayCompletedCount > 0) {
      todayDeepMins = todayCompletedCount * 30;
    }

    let todayRestMins = 20;
    schedule.forEach(s => {
      if (s.completed && (s.title.toLowerCase().includes("rest") || s.subtitle.toLowerCase().includes("break"))) {
        todayRestMins += 15;
      }
    });

    return initialInsights.map(item => {
      if (item.date === currentDayName) {
        return {
          ...item,
          deepWorkMins: todayDeepMins || 45,
          activeRestMins: todayRestMins,
          cognitiveCapacity: cognitiveInsights.cognitiveCapacity,
          completedTasks: todayCompletedCount
        };
      }
      return item;
    });
  };

  return {
    aiAdvice,
    fetchAiAdvice,
    cognitiveInsights,
    fetchCognitiveInsights,
    getDynamicInsights
  };
}
