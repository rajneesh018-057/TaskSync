import React, { useState, useEffect } from "react";
import { Task, Goal, ScheduleItem } from "../types";
import { initialTasks, initialGoals, initialSchedule } from "../data";

interface UseAppDataProps {
  token: string | null;
}

export function useAppData({ token }: UseAppDataProps) {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");

  // Core App State
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("lifesaver_tasks");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialTasks;
  });

  const [deletedTasks, setDeletedTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("lifesaver_deleted_tasks");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [historyTab, setHistoryTab] = useState<"completed" | "deleted">("completed");

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem("lifesaver_goals");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialGoals;
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem("lifesaver_schedule");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialSchedule;
  });

  // Calendar states
  const [isCalendarConnected, setIsCalendarConnected] = useState<boolean>(() => {
    return localStorage.getItem("lifesaver_calendar_connected") === "true";
  });
  const [connectedSources, setConnectedSources] = useState<string[]>(() => {
    const saved = localStorage.getItem("lifesaver_connected_sources");
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });
  const [plannerView, setPlannerView] = useState<"day" | "week" | "month">("week");
  const [appliedOptimizations, setAppliedOptimizations] = useState<string[]>([]);
  const [showConnectionMenu, setShowConnectionMenu] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);

  // Capture modal & input states
  const [inboxText, setInboxText] = useState("");
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageFeedback, setTriageFeedback] = useState<string | null>(null);
  const [parserRunning, setParserRunning] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<Partial<Task> | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskGoalProject, setNewTaskGoalProject] = useState("General");
  const [customDuration, setCustomDuration] = useState("45m");
  const [rawDumpInput, setRawDumpInput] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>("task-1");

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("lifesaver_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("lifesaver_deleted_tasks", JSON.stringify(deletedTasks));
  }, [deletedTasks]);

  useEffect(() => {
    localStorage.setItem("lifesaver_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("lifesaver_schedule", JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem("lifesaver_calendar_connected", String(isCalendarConnected));
  }, [isCalendarConnected]);

  useEffect(() => {
    localStorage.setItem("lifesaver_connected_sources", JSON.stringify(connectedSources));
  }, [connectedSources]);

  // Capture Google OAuth callbacks for calendar redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calendarConnected = params.get("calendarConnected");

    if (calendarConnected === "true" || window.location.pathname === "/planner") {
      setIsCalendarConnected(true);
      setConnectedSources((prev) => (prev.includes("google") ? prev : [...prev, "google"]));
      setActiveTab("planner");
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // Fetch Google Calendar events
  useEffect(() => {
    if (!token || !isCalendarConnected) {
      setGoogleEvents([]);
      return;
    }

    const fetchGoogleEvents = async () => {
      try {
        const res = await fetch("/api/calendar/events", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setGoogleEvents(data);
        } else {
          console.warn("Failed to fetch Google Calendar events");
        }
      } catch (err) {
        console.error("Error fetching Google Calendar events:", err);
      }
    };

    fetchGoogleEvents();
    const interval = setInterval(fetchGoogleEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token, isCalendarConnected]);

  // Load initial data from database when token is available
  useEffect(() => {
    if (!token) {
      setInitialLoadComplete(false);
      return;
    }

    const loadData = async () => {
      try {
        const tasksRes = await fetch("/api/tasks", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const dbTasks = tasksRes.ok ? await tasksRes.json() : [];

        const goalsRes = await fetch("/api/goals", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const dbGoals = goalsRes.ok ? await goalsRes.json() : [];

        const scheduleRes = await fetch("/api/schedule", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const dbSchedule = scheduleRes.ok ? await scheduleRes.json() : [];

        setTasks(dbTasks);
        setGoals(dbGoals);
        setSchedule(dbSchedule);
        setInitialLoadComplete(true);
      } catch (err) {
        console.error("Failed to load user data from database:", err);
        setInitialLoadComplete(true);
      }
    };

    loadData();
  }, [token]);

  // Sync tasks to backend
  useEffect(() => {
    if (!token || !initialLoadComplete) return;

    const syncTasks = async () => {
      try {
        const res = await fetch("/api/tasks/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ tasks })
        });
        if (res.ok) {
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (e) {
        console.error("Failed to sync tasks:", e);
      }
    };

    const timeoutId = setTimeout(syncTasks, 1000);
    return () => clearTimeout(timeoutId);
  }, [tasks, token, initialLoadComplete]);

  // Sync goals to backend
  useEffect(() => {
    if (!token || !initialLoadComplete) return;

    const syncGoals = async () => {
      try {
        await fetch("/api/goals/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ goals })
        });
      } catch (e) {
        console.error("Failed to sync goals:", e);
      }
    };

    const timeoutId = setTimeout(syncGoals, 1000);
    return () => clearTimeout(timeoutId);
  }, [goals, token, initialLoadComplete]);

  // Sync schedule items to backend
  useEffect(() => {
    if (!token || !initialLoadComplete) return;

    const syncSchedule = async () => {
      try {
        await fetch("/api/schedule/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ schedule })
        });
      } catch (e) {
        console.error("Failed to sync schedule:", e);
      }
    };

    const timeoutId = setTimeout(syncSchedule, 1000);
    return () => clearTimeout(timeoutId);
  }, [schedule, token, initialLoadComplete]);

  // Core modification handlers
  const handleAddNewTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      project: newTaskGoalProject,
      nextStep: parsedPreview?.nextStep || "Review project essentials",
      score: parsedPreview?.score || 60,
      duration: customDuration,
      cognitiveLoad: parsedPreview?.cognitiveLoad || "Medium Cognitive Load",
      completed: false,
      explanation: parsedPreview?.explanation || "Created manually via capture action. Set project context details clearly to optimize scheduler.",
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle("");
    setRawDumpInput("");
    setParsedPreview(null);
  };

  const handleDirectAdd = (title: string) => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      project: "General",
      nextStep: "Identify immediate milestone action",
      score: 55,
      duration: "30m",
      cognitiveLoad: "Medium Cognitive Load",
      completed: false,
      explanation: "Quick task added directly. Click to request dynamic priority scores and cognitive load matching details.",
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [...prev, newTask]);
    setExpandedTaskId(newTask.id);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => 
      prev.map(t => {
        if (t.id === taskId) {
          return { ...t, completed: !t.completed };
        }
        return t;
      })
    );
  };

  const handleToggleScheduleItem = (itemId: string) => {
    setSchedule(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          return { ...item, completed: !item.completed };
        }
        return item;
      })
    );
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete) {
      setDeletedTasks(prev => [taskToDelete, ...prev]);
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    }
  };

  const handleRestoreDeletedTask = (taskId: string) => {
    const taskToRestore = deletedTasks.find(t => t.id === taskId);
    if (taskToRestore) {
      setTasks(prev => [...prev, taskToRestore]);
      setDeletedTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const handlePermanentDeleteTask = (taskId: string) => {
    setDeletedTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleClearAllDeletedTasks = () => {
    setDeletedTasks([]);
    localStorage.removeItem("lifesaver_deleted_tasks");
  };

  // AI parser raw text prioritization
  const handleParseRawText = async (textToParse: string, fromTriageTab = false) => {
    if (!textToParse.trim()) return;
    
    if (fromTriageTab) {
      setTriageLoading(true);
      setTriageFeedback(null);
    } else {
      setParserRunning(true);
    }

    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/prioritize", {
        method: "POST",
        headers,
        body: JSON.stringify({
          rawText: textToParse,
          goals: goals,
          existingTasks: tasks
        })
      });

      if (response.ok) {
        const parsed = await response.json();
        
        if (fromTriageTab) {
          const newTask: Task = {
            id: `task-${Date.now()}`,
            title: parsed.title || textToParse,
            project: parsed.project || "General",
            nextStep: parsed.nextStep || "Process parsed information",
            score: parsed.score || 70,
            duration: parsed.duration || "45m",
            cognitiveLoad: parsed.cognitiveLoad || "Medium Cognitive Load",
            completed: false,
            explanation: parsed.explanation || "Dynamically sorted by Active Calm Priority engine.",
            createdAt: new Date().toISOString()
          };
          setTasks(prev => [newTask, ...prev]);
          setInboxText("");
          setTriageFeedback(`Successfully created priority task: "${newTask.title}" directly in your dashboard!`);
        } else {
          setParsedPreview({
            title: parsed.title,
            project: parsed.project,
            score: parsed.score,
            duration: parsed.duration,
            cognitiveLoad: parsed.cognitiveLoad,
            nextStep: parsed.nextStep,
            explanation: parsed.explanation
          });
          setNewTaskTitle(parsed.title || "");
          setNewTaskGoalProject(parsed.project || "General");
          setCustomDuration(parsed.duration || "45m");
        }
      } else {
        throw new Error("Server priority error");
      }
    } catch (err) {
      console.warn("Fallback parser local categorization strategy:", err);
      const fallbackPreview: Partial<Task> = {
        title: textToParse.length > 40 ? textToParse.substring(0, 40) + "..." : textToParse,
        project: "General",
        score: Math.floor(Math.random() * 40) + 50,
        duration: "30m",
        cognitiveLoad: "Medium Cognitive Load",
        nextStep: "Calibrating details manually",
        explanation: "Parsed with local algorithm. Assign an AI Studio API secret key for full executive counselor prioritization strategy."
      };
      
      if (fromTriageTab) {
        const newTask: Task = {
          id: `task-${Date.now()}`,
          title: fallbackPreview.title!,
          project: fallbackPreview.project!,
          nextStep: fallbackPreview.nextStep,
          score: fallbackPreview.score!,
          duration: fallbackPreview.duration!,
          cognitiveLoad: fallbackPreview.cognitiveLoad!,
          completed: false,
          explanation: fallbackPreview.explanation,
          createdAt: new Date().toISOString()
        };
        setTasks(prev => [newTask, ...prev]);
        setInboxText("");
        setTriageFeedback(`Task categorized locally: "${newTask.title}". Provide an API Key to activate intelligent scoring!`);
      } else {
        setParsedPreview(fallbackPreview);
        setNewTaskTitle(fallbackPreview.title || "");
        setNewTaskGoalProject(fallbackPreview.project || "General");
        setCustomDuration(fallbackPreview.duration || "30m");
      }
    } finally {
      setParserRunning(false);
      setTriageLoading(false);
    }
  };

  const handleResetAllData = () => {
    setTasks([]);
    setGoals([]);
    setSchedule([]);
    setDeletedTasks([]);
    setInitialLoadComplete(false);
  };

  return {
    activeTab,
    setActiveTab,
    initialLoadComplete,
    setInitialLoadComplete,
    lastSyncTime,
    setLastSyncTime,
    tasks,
    setTasks,
    deletedTasks,
    setDeletedTasks,
    historyTab,
    setHistoryTab,
    goals,
    setGoals,
    schedule,
    setSchedule,
    isCalendarConnected,
    setIsCalendarConnected,
    connectedSources,
    setConnectedSources,
    plannerView,
    setPlannerView,
    appliedOptimizations,
    setAppliedOptimizations,
    showConnectionMenu,
    setShowConnectionMenu,
    isConnecting,
    setIsConnecting,
    googleEvents,
    setGoogleEvents,
    inboxText,
    setInboxText,
    triageLoading,
    setTriageLoading,
    triageFeedback,
    setTriageFeedback,
    parserRunning,
    setParserRunning,
    parsedPreview,
    setParsedPreview,
    newTaskTitle,
    setNewTaskTitle,
    newTaskGoalProject,
    setNewTaskGoalProject,
    customDuration,
    setCustomDuration,
    rawDumpInput,
    setRawDumpInput,
    expandedTaskId,
    setExpandedTaskId,
    handleAddNewTask,
    handleDirectAdd,
    handleToggleTask,
    handleToggleScheduleItem,
    handleDeleteTask,
    handleRestoreDeletedTask,
    handlePermanentDeleteTask,
    handleClearAllDeletedTasks,
    handleParseRawText,
    handleResetAllData
  };
}
