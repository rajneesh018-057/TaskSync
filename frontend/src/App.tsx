import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Search, 
  Bell, 
  X, 
  AlertTriangle
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import AIAssistantDrawer from "./components/AIAssistantDrawer";
import DashboardView from "./components/DashboardView";
import InboxView from "./components/InboxView";
import PlannerView from "./components/PlannerView";
import GoalsView from "./components/GoalsView";
import InsightsView from "./components/InsightsView";
import SettingsView from "./components/SettingsView";
import CaptureModal from "./components/CaptureModal";
import { Task, Goal, ScheduleItem, DailyInsight } from "./types";
import { initialTasks, initialGoals, initialSchedule, initialInsights } from "./data";
import { formatTime, calculateRiskLevel } from "./utils";

export default function App() {
  // Navigation & User Context
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("lifesaver_username") || "Alex Chen";
  });
  const [isPro, setIsPro] = useState<boolean>(true);
  const [darkCalmMode, setDarkCalmMode] = useState<boolean>(() => {
    return localStorage.getItem("lifesaver_dark_calm") === "true";
  });

  // Core App State (hydrated from localStorage or default static templates)
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("lifesaver_tasks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialTasks;
  });

  const [deletedTasks, setDeletedTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("lifesaver_deleted_tasks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [historyTab, setHistoryTab] = useState<"completed" | "deleted">("completed");

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem("lifesaver_goals");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialGoals;
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem("lifesaver_schedule");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialSchedule;
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>("");

  // AI-Assisted Recommendation State
  const [aiAdvice, setAiAdvice] = useState<{
    suggestion: string;
    predictedLoad: string;
    alignmentScore: number;
    loading: boolean;
  }>({
    suggestion: 'AI suggests assigning "Review Q3 Financials" to your 2:00 PM deep work block.',
    predictedLoad: "High Peak Cognitive Load",
    alignmentScore: 92,
    loading: false
  });

  // Quick Triage Raw Text Inbox State
  const [inboxText, setInboxText] = useState("");
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageFeedback, setTriageFeedback] = useState<string | null>(null);

  // Focus Timer States (Deep Work & Active Rest)
  const [timerType, setTimerType] = useState<"deep-work" | "active-rest">("deep-work");
  const [timerState, setTimerState] = useState<"idle" | "running" | "paused" | "completed">("idle");
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(90 * 60);
  const [timerTotalDuration, setTimerTotalDuration] = useState<number>(90 * 60);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [focusStreak, setFocusStreak] = useState<number>(3);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Capture Task Modal State
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskGoalProject, setNewTaskGoalProject] = useState("General");
  const [customDuration, setCustomDuration] = useState("45m");
  const [rawDumpInput, setRawDumpInput] = useState("");
  const [parserRunning, setParserRunning] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<Partial<Task> | null>(null);

  // Selected Task Accordion ID
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>("task-1");

  // Notifications State for the Bell
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; read: boolean }>>([
    { id: "noti-1", text: "Predictive Schedule Alignment available for Review Q3 Financials.", read: false },
    { id: "noti-2", text: "Attention: 2 Deep Work block configurations were automatically consolidated.", read: true },
  ]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  // Synchronization Indicators
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");

  // AI Scheduling Command Center States
  const [isCalendarConnected, setIsCalendarConnected] = useState<boolean>(false);
  const [connectedSources, setConnectedSources] = useState<string[]>([]);
  const [plannerView, setPlannerView] = useState<"day" | "week" | "month">("week");
  const [appliedOptimizations, setAppliedOptimizations] = useState<string[]>([]);
  const [showConnectionMenu, setShowConnectionMenu] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Local storage synchronization
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
    localStorage.setItem("lifesaver_username", userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem("lifesaver_dark_calm", String(darkCalmMode));
    if (darkCalmMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkCalmMode]);

  // Request alignment counselor recommendation on load / task edit
  const fetchAiAdvice = async () => {
    setAiAdvice(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch("/api/suggest-alignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      // fallback
      setTimeout(() => {
        setAiAdvice({
          suggestion: tasks.length > 0 
            ? `AI suggests finishing "${tasks[0].title}" to reach a Risk Level of Low during the next index block.` 
            : "AI suggests drafting your high-priority goals to set proper milestone targets.",
          predictedLoad: "Medium Cognitive Load",
          alignmentScore: 88,
          loading: false
        });
      }, 600);
    }
  };

  useEffect(() => {
    fetchAiAdvice();
    const interval = setInterval(() => {
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(interval);
  }, [tasks.length]);

  // Timer interval control
  useEffect(() => {
    if (timerState === "running") {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setTimerState("completed");
            setFocusStreak(streak => streak + 1);
            if (soundEnabled) {
              try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
                oscillator.connect(audioCtx.destination);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 1.5);
              } catch (_) {}
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerState, soundEnabled]);

  // AI-powered raw sentence prioritization parser
  const handleParseRawText = async (textToParse: string, fromTriageTab = false) => {
    if (!textToParse.trim()) return;
    
    if (fromTriageTab) {
      setTriageLoading(true);
      setTriageFeedback(null);
    } else {
      setParserRunning(true);
    }

    try {
      const response = await fetch("/api/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      // dynamic locally computed fallback simulation
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

  // Add Task manually
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
    setIsCaptureModalOpen(false);
    setNewTaskTitle("");
    setRawDumpInput("");
    setParsedPreview(null);
  };

  // Fast direct inline task capturing on dashboard
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

  // Toggle tasks completion state
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

  // Toggle schedule item completed
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

  // Delete task
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

  // Restore deleted task
  const handleRestoreDeletedTask = (taskId: string) => {
    const taskToRestore = deletedTasks.find(t => t.id === taskId);
    if (taskToRestore) {
      setTasks(prev => [...prev, taskToRestore]);
      setDeletedTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  // Permanently delete task from history
  const handlePermanentDeleteTask = (taskId: string) => {
    setDeletedTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Start Focus Block from Dash Cards
  const handleStartFocusTimer = (type: "deep-work" | "active-rest") => {
    setTimerType(type);
    const durationMins = type === "deep-work" ? 90 : 15;
    setTimerTotalDuration(durationMins * 60);
    setTimerSecondsLeft(durationMins * 60);
    setTimerState("running");
    setActiveTab("planner"); // Navigate to planner/focus screen
  };

  // Dynamic values based on active task metrics
  const activeUncompletedTasks = tasks.filter(t => !t.completed);
  const activeUncompletedCount = activeUncompletedTasks.length;
  const currentRisk = calculateRiskLevel(tasks);

  // Filter tasks with search bar query
  const filteredTasks = tasks.filter(task => {
    const matchQuery = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.nextStep && task.nextStep.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchQuery;
  });

  return (
    <div className={`min-h-screen font-sans antialiased text-[#1b1b21] transition-colors duration-300 ${darkCalmMode ? "bg-[#12121a] text-white" : "bg-[#fbf8ff] text-[#1b1b21]"}`}>
      
      {/* Sidebar - Fixed Left Rail */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // Auto close capture dialogs or temporary focus menus on tab switch
          setShowNotificationsMenu(false);
        }}
        userName={userName}
        isPro={isPro}
        tasksCount={activeUncompletedCount}
      />

      {/* Top Navigation Bar / Search / Notifications */}
      <header 
        id="top-bar"
        className={`fixed top-0 right-0 w-[calc(100%-280px)] h-16 px-8 z-20 flex justify-between items-center transition-all duration-300 border-b backdrop-blur-md ${
          darkCalmMode 
            ? "bg-[#12121a]/85 border-[#e4e1ea]/10" 
            : "bg-white/80 border-[#efecf6]"
        }`}
      >
        {/* Search Field */}
        <div className="flex items-center gap-2 max-w-sm w-full">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full w-full border transition-all duration-200 ${
            darkCalmMode 
              ? "bg-[#efecf6]/5 border-[#e4e1ea]/10 text-white" 
              : "bg-[#f5f2fb] border-[#efecf6] text-[#464652]"
          }`}>
            <Search className="w-4 h-4 text-[#72749b] shrink-0" />
            <input 
              id="search-input"
              type="text"
              placeholder="Search active tasks, goals, next actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full placeholder:text-[#c7c5d4] focus:ring-0"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-black/10 rounded-full">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-4">
          
          {/* Theme status indicator switch */}
          <button
            id="theme-toggle"
            onClick={() => setDarkCalmMode(!darkCalmMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-mono uppercase tracking-wider transition-all border ${
              darkCalmMode 
                ? "bg-gradient-to-r from-[#5054b1] to-[#373b97] text-white border-[#5054b1]/30" 
                : "bg-white text-[#5054b1] hover:bg-[#f5f2fb] border-[#efecf6]"
            }`}
            title="Toggle Active Calm Dark mode (reduces visual cortisol strain)"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${darkCalmMode ? "bg-cyan-300 animate-pulse" : "bg-[#5054b1]"}`} />
            <span>{darkCalmMode ? "Active Calm Light Mode" : "Standard Mode"}</span>
          </button>

          {/* Sync status */}
          <span className="hidden md:inline text-[10px] font-mono text-[#72749b]">
            Cloud Synced: <span className="text-[#5054b1] font-semibold">{lastSyncTime}</span>
          </span>

          {/* Inbox notifications bell */}
          <div className="relative">
            <button 
              id="notifications-bell"
              onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
              className={`p-2 rounded-xl transition-all relative ${
                darkCalmMode ? "hover:bg-white/10 text-[#bfc1ff]" : "hover:bg-[#f5f2fb] text-[#72749b] hover:text-[#010047]"
              }`}
            >
              <Bell className="w-5 h-5 text-current" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Notifications drop down visual stack */}
            {showNotificationsMenu && (
              <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border p-4 z-50 ${
                darkCalmMode ? "bg-[#181822] border-[#bfc1ff]/10 text-white" : "bg-white border-[#efecf6] text-[#1b1b21]"
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-display font-bold text-xs text-[#010047] dark:text-white uppercase tracking-tight">System Alerts</h4>
                  <button 
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({...n, read: true})));
                    }}
                    className="text-[10px] text-[#5054b1] hover:underline font-mono"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map(item => (
                    <div 
                      key={item.id}
                      className={`p-2.5 rounded-lg text-xs transition-colors ${
                        item.read 
                          ? "opacity-65" 
                          : darkCalmMode ? "bg-white/5 border border-white/5" : "bg-[#f5f2fb]"
                      }`}
                    >
                      <p className="font-sans leading-relaxed text-[11px]">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CAPTURE TASK button action */}
          <button 
            id="capture-task-btn"
            onClick={() => setIsCaptureModalOpen(true)}
            className="flex items-center gap-2 bg-[#5054b1] hover:bg-[#373b97] active:scale-95 text-white font-sans text-xs font-semibold px-5 py-2 rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Capture Task</span>
          </button>

        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="ml-[280px] pt-16 min-h-screen px-8 pb-16">
        
        {/* Dynamic global risk feedback banner if tasks grow heavy */}
        {activeUncompletedCount >= 5 && (
          <div className="mt-4 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
              <div>
                <p className="font-semibold text-xs text-rose-800">Extreme cognitive load warning</p>
                <p className="text-[11px] text-rose-700 leading-tight">You have {activeUncompletedCount} active priorities today. Consider starting deep work triage blocks to offload tasks.</p>
              </div>
            </div>
            <button 
              onClick={() => handleStartFocusTimer("deep-work")}
              className="text-xs bg-rose-700 hover:bg-rose-800 text-white font-semibold px-3 py-1.5 rounded-lg transition-all"
            >
              Start Deep Focus Loop
            </button>
          </div>
        )}

                {/* 1. DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <DashboardView
            darkCalmMode={darkCalmMode}
            aiAdvice={aiAdvice}
            fetchAiAdvice={fetchAiAdvice}
            tasks={tasks}
            filteredTasks={filteredTasks}
            expandedTaskId={expandedTaskId}
            setExpandedTaskId={setExpandedTaskId}
            handleToggleTask={handleToggleTask}
            handleDeleteTask={handleDeleteTask}
            handleRestoreDeletedTask={handleRestoreDeletedTask}
            handlePermanentDeleteTask={handlePermanentDeleteTask}
            handleDirectAdd={handleDirectAdd}
            setIsCaptureModalOpen={setIsCaptureModalOpen}
            schedule={schedule}
            handleToggleScheduleItem={handleToggleScheduleItem}
            deletedTasks={deletedTasks}
            historyTab={historyTab}
            setHistoryTab={setHistoryTab}
            currentRisk={currentRisk}
          />
        )}

        {/* 2. INBOX TRIAGE VIEW */}
        {activeTab === "inbox" && (
          <InboxView
            darkCalmMode={darkCalmMode}
            inboxText={inboxText}
            setInboxText={setInboxText}
            triageLoading={triageLoading}
            triageFeedback={triageFeedback || ""}
            tasks={tasks}
            handleParseRawText={handleParseRawText}
          />
        )}

        {/* 3. FOCUS TIMER & PLANNER VIEW */}
        {activeTab === "planner" && (
          <PlannerView
            darkCalmMode={darkCalmMode}
            plannerView={plannerView}
            setPlannerView={setPlannerView}
            isCalendarConnected={isCalendarConnected}
            setIsCalendarConnected={setIsCalendarConnected}
            connectedSources={connectedSources}
            setConnectedSources={setConnectedSources}
            appliedOptimizations={appliedOptimizations}
            setAppliedOptimizations={setAppliedOptimizations}
            showConnectionMenu={showConnectionMenu}
            setShowConnectionMenu={setShowConnectionMenu}
            isConnecting={isConnecting}
            setIsConnecting={setIsConnecting}
          />
        )}

        {/* 4. GOALS VIEW */}
        {activeTab === "goals" && (
          <GoalsView
            darkCalmMode={darkCalmMode}
            goals={goals}
            setGoals={setGoals}
          />
        )}

        {/* 5. ANALYTICS INSIGHTS VIEW */}
        {activeTab === "insights" && (
          <InsightsView
            darkCalmMode={darkCalmMode}
            insights={initialInsights}
          />
        )}

        {/* 6. SETTINGS VIEW */}
        {activeTab === "settings" && (
          <SettingsView
            darkCalmMode={darkCalmMode}
            userName={userName}
            setUserName={setUserName}
            isPro={isPro}
          />
        )}

      </main>

      <CaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        darkCalmMode={darkCalmMode}
        rawDumpInput={rawDumpInput}
        setRawDumpInput={setRawDumpInput}
        newTaskTitle={newTaskTitle}
        setNewTaskTitle={setNewTaskTitle}
        newTaskGoalProject={newTaskGoalProject}
        setNewTaskGoalProject={setNewTaskGoalProject}
        customDuration={customDuration}
        setCustomDuration={setCustomDuration}
        parserRunning={parserRunning}
        parsedPreview={parsedPreview}
        handleParseRawText={handleParseRawText}
        handleAddNewTask={handleAddNewTask}
      />

      <AIAssistantDrawer 
        tasks={tasks}
        schedule={schedule}
        setSchedule={setSchedule}
        isDark={darkCalmMode}
        onOpenCaptureModal={() => setIsCaptureModalOpen(true)}
      />

    </div>
  );
}
