import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  X, 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  HelpCircle,
  CornerDownLeft,
  ChevronRight,
  TrendingUp,
  Brain,
  MessageSquare,
  Send,
  Loader2
} from "lucide-react";
import { Task, ScheduleItem } from "../types";

interface AIAssistantDrawerProps {
  tasks: Task[];
  schedule: ScheduleItem[];
  setSchedule: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
  isDark: boolean;
  onOpenCaptureModal: () => void;
  token?: string | null;
  aiAdvice?: {
    suggestion: string;
    predictedLoad: string;
    alignmentScore: number;
    loading: boolean;
  };
}

export default function AIAssistantDrawer({
  tasks,
  schedule,
  setSchedule,
  isDark,
  onOpenCaptureModal,
  token,
  aiAdvice
}: AIAssistantDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [recommendationApproved, setRecommendationApproved] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Derive active tasks and highest priority task dynamically
  const activeTasks = tasks.filter(t => !t.completed);
  const highestTask = [...activeTasks].sort((a, b) => b.score - a.score)[0];
  const hasTasks = activeTasks.length > 0 || schedule.length > 0;

  // Dynamic Risk Score calculation based on active task volume and priority scores
  const computedRiskScore = activeTasks.length === 0 
    ? 15 
    : Math.min(99, Math.max(25, activeTasks.length * 15 + (highestTask ? Math.floor(highestTask.score * 0.35) : 0)));

  const computedCognitiveLoad = aiAdvice?.predictedLoad || (
    activeTasks.length >= 4 
      ? "High Peak Cognitive Load" 
      : activeTasks.length >= 2 
        ? "Medium Cognitive Load" 
        : "Low Rest State"
  );

  // Dynamic Critical Insight Alert text
  const criticalInsightAlertText = aiAdvice?.suggestion || (
    highestTask 
      ? `High priority task "${highestTask.title}" (${highestTask.project}) with score ${highestTask.score}/100 requires focused execution. You have ${activeTasks.length} pending task(s) in queue.` 
      : activeTasks.length > 0 
        ? `You have ${activeTasks.length} active task(s) competing for mental bandwidth. Allocate dedicated focus blocks to minimize switching.` 
        : "No active tasks in queue. Add project goals or schedule a focus block to maintain cognitive momentum."
  );

  // Dynamic Recommended Action Title & Bullet List
  const actionTitle = highestTask
    ? `Allocate 90-min Deep Focus block for "${highestTask.title}"`
    : "Reschedule overlapping timeline events";

  const actionImpactList = highestTask ? [
    `Prioritize highest score task (${highestTask.score}/100)`,
    `Allocate ${highestTask.duration} focus interval`,
    `Advance project: ${highestTask.project}`
  ] : [
    "Reduce peak overload",
    "Recover 90 minutes",
    "Increase focus score"
  ];

  // Dynamic Why This Recommendation text
  const whyRecommendationText = highestTask 
    ? `Based on your workload analysis, "${highestTask.title}" holds your highest priority score (${highestTask.score}) in project "${highestTask.project}". ${highestTask.nextStep ? `Immediate next step: "${highestTask.nextStep}".` : ""} Tackling this first maximizes completion probability.`
    : "Based on your active task queue, organizing your schedule into focus blocks prevents context switches and improves daily completion rates.";

  // Dynamic Completion Probabilities
  const currentCompletionProb = activeTasks.length === 0 ? 92 : Math.max(30, Math.min(85, 95 - activeTasks.length * 9));
  const improvedCompletionProb = Math.min(98, currentCompletionProb + 25);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus trap inside drawer
  useEffect(() => {
    if (!isOpen) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusableElements = drawer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    setTimeout(() => {
      firstElement?.focus();
    }, 100);

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    drawer.addEventListener("keydown", handleFocusTrap);
    return () => drawer.removeEventListener("keydown", handleFocusTrap);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1200);
  };

  const handleClose = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
      handleClose();
    }
  };

  // Dynamic reschedule action handler adding/updating focus block in schedule
  const handleApproveReschedule = () => {
    if (highestTask) {
      setSchedule(prev => {
        const existingIndex = prev.findIndex(item => item.title.includes(highestTask.title) || item.isNow);
        if (existingIndex !== -1) {
          return prev.map((item, idx) => idx === existingIndex ? {
            ...item,
            title: `DEEP FOCUS: ${highestTask.title}`,
            subtitle: `Optimized by AI Coach (${highestTask.project})`,
            isNow: true
          } : item);
        } else {
          return [
            ...prev,
            {
              id: `sched-auto-${Date.now()}`,
              time: "10:00",
              title: `DEEP FOCUS: ${highestTask.title}`,
              subtitle: `Optimized by AI Coach (${highestTask.project})`,
              completed: false,
              isNow: true
            }
          ];
        }
      });
    } else {
      setSchedule(prev => 
        prev.map(item => {
          if (item.title.includes("Project Sync") || item.title.includes("Focus")) {
            return {
              ...item,
              time: "16:00",
              subtitle: "Rescheduled by AI Coach to optimize cognitive flow"
            };
          }
          return item;
        })
      );
    }
    setRecommendationApproved(true);
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatHistory(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userMsg,
          history: chatHistory,
          tasks: tasks.filter(t => !t.completed),
          schedule: schedule
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { sender: "ai", text: data.text }]);
      } else {
        throw new Error("Failed to get response from AI");
      }
    } catch (err) {
      console.error("AI Coach Chat error:", err);
      let fallbackText = "I'm analyzing your current timeline. Let's optimize your workload to minimize switches.";
      const lower = userMsg.toLowerCase();

      if (lower.includes("focus") || lower.includes("today")) {
        if (highestTask) {
          fallbackText = `Today you should focus on '${highestTask.title}'. It has a high priority score of ${highestTask.score} and aligns with your '${highestTask.project}' project. Start in your next deep work block.`;
        } else {
          fallbackText = "Today you should focus on defining your core goals and scheduling new tasks to build your productivity roadmap.";
        }
      } else if (lower.includes("deadline") || lower.includes("risk")) {
        fallbackText = "Your active targets are currently being monitored. Check the Planner tab to ensure you have dedicated focus blocks scheduled.";
      } else if (lower.includes("friday") || lower.includes("finish")) {
        fallbackText = "Yes, but you must resolve any overlapping schedule events tomorrow afternoon to stay on track.";
      } else if (lower.includes("cognitive") || lower.includes("load")) {
        fallbackText = "To reduce cognitive load, bundle minor admin tasks into a single 20-minute slot at the end of the day.";
      }
      setChatHistory(prev => [...prev, { sender: "ai", text: fallbackText }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleQuickPrompt = async (promptText: string) => {
    if (chatLoading) return;
    setChatHistory(prev => [...prev, { sender: "user", text: promptText }]);
    setChatLoading(true);

    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: promptText,
          history: chatHistory,
          tasks: tasks.filter(t => !t.completed),
          schedule: schedule
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { sender: "ai", text: data.text }]);
      } else {
        throw new Error("Failed to get response from AI");
      }
    } catch (err) {
      console.error("AI Coach Quick Prompt error:", err);
      let fallbackText = "Checking workload metrics...";
      const lower = promptText.toLowerCase();

      if (lower.includes("focus")) {
        if (highestTask) {
          fallbackText = `Today you should focus on '${highestTask.title}'. It has a high priority score of ${highestTask.score} and aligns with your '${highestTask.project}' project. Start in your next deep work block.`;
        } else {
          fallbackText = "Today you should focus on defining your core goals and scheduling new tasks to build your productivity roadmap.";
        }
      } else if (lower.includes("deadline")) {
        fallbackText = "Your active targets are currently being monitored. Check the Planner tab to ensure you have dedicated focus blocks scheduled.";
      } else if (lower.includes("finish")) {
        fallbackText = "Yes, but you must resolve any overlapping schedule events tomorrow afternoon to stay on track.";
      } else if (lower.includes("reduce")) {
        fallbackText = "To reduce cognitive load, bundle minor admin tasks into a single 20-minute slot at the end of the day.";
      }
      setChatHistory(prev => [...prev, { sender: "ai", text: fallbackText }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      {/* Floating AI Trigger Button */}
      <button
        ref={triggerRef}
        onClick={handleOpen}
        id="floating-ai-trigger"
        aria-label="Open AI Cognitive Intelligence Coach"
        aria-expanded={isOpen}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-[#5054b1] hover:bg-[#373b97] text-white flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#5054b1] focus:ring-offset-2 pulse-glow"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
      </button>

      {/* Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-[#010047]/20 backdrop-blur-[2px] z-45 transition-opacity duration-300 animate-in fade-in"
        >
          {/* Drawer Panel Container */}
          <div
            ref={drawerRef}
            id="ai-assistant-drawer"
            className={`fixed right-0 top-0 h-full w-[420px] shadow-2xl border-l flex flex-col transition-transform duration-250 ease-out transform translate-x-0 ${
              isDark 
                ? "bg-[#14141d] border-white/10 text-white" 
                : "bg-white border-[#efecf6] text-[#1b1b21]"
            }`}
            style={{
              animation: "slideInRight 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
            }}
          >
            {/* Custom keyframe animation style injection */}
            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
            `}</style>

            {loading ? (
              /* Loading Analysis State */
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                <Loader2 className="w-12 h-12 text-[#5054b1] animate-spin" />
                <div className="text-center">
                  <h3 className="font-display font-bold text-lg">Analyzing your workload...</h3>
                  <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Correlating focus blocks, tasks, and meetings.
                  </p>
                </div>
              </div>
            ) : !hasTasks ? (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#5054b1]/10 flex items-center justify-center text-[#5054b1]">
                  <Brain className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-lg">No active workload detected.</h3>
                  <p className={`text-xs px-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Add tasks or connect your calendar to receive personalized recommendations.
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleClose();
                    onOpenCaptureModal();
                  }}
                  className="px-6 py-2.5 bg-[#5054b1] hover:bg-[#373b97] text-white rounded-xl font-sans text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer min-h-[44px]"
                >
                  Create First Task
                </button>
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 hover:bg-black/10 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  aria-label="Close panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              /* Full Intelligence Panel Content */
              <>
                {/* Header */}
                <div className={`p-5 border-b flex items-start justify-between ${
                  isDark ? "border-white/10" : "border-[#efecf6]"
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#5054b1]" />
                      <h2 className="font-display font-bold text-md tracking-tight">AI Insight</h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className={`text-[10px] font-mono uppercase tracking-wider ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}>
                        Analyzing Schedule
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-[10px] font-mono font-bold ${
                        computedRiskScore > 70 ? "text-rose-500" : computedRiskScore > 40 ? "text-amber-500" : "text-emerald-500"
                      }`}>
                        Risk Score: {computedRiskScore}
                      </div>
                      <div className="text-[10px] text-amber-500 font-semibold">{computedCognitiveLoad}</div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-2 hover:bg-black/10 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Close panel"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content Container */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  
                  {/* Section 1: Critical Insight Alert */}
                  <div className={`p-4 rounded-xl border flex gap-3 ${
                    isDark 
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-200" 
                      : "bg-rose-50 border-rose-200 text-rose-950"
                  }`}>
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-display uppercase tracking-wider">Critical Insight Alert</span>
                        <span className="text-[9px] font-mono uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">
                          Critical
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed font-sans">
                        {criticalInsightAlertText}
                      </p>
                    </div>
                  </div>

                  {/* Section 2: Recommended Action */}
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    isDark ? "bg-white/5 border-white/10" : "bg-white border-[#efecf6]"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-display uppercase tracking-wider text-[#5054b1]">Recommended Action</span>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-[#5054b1]/5 border border-[#5054b1]/15 text-[11px] font-sans">
                      {recommendationApproved ? (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                          <Check className="w-4 h-4" />
                          <span>Recommendation Approved: Focus block scheduled for "{highestTask?.title || "Top Task"}".</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold block text-xs">{actionTitle}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 block">
                              Expected impact:
                            </span>
                            <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-gray-500 dark:text-gray-400 text-[10px]">
                              {actionImpactList.map((impact, i) => (
                                <li key={i}>{impact}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {!recommendationApproved && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleApproveReschedule}
                          className="flex-1 py-2 px-3 bg-[#5054b1] hover:bg-[#373b97] text-white rounded-lg text-[11px] font-semibold transition-all active:scale-95 cursor-pointer min-h-[36px]"
                        >
                          Approve Change
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Section 3: Why This Recommendation */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold font-display uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Why This Recommendation
                    </h3>
                    <p className={`text-[11px] leading-relaxed font-sans ${
                      isDark ? "text-gray-300" : "text-gray-600"
                    }`}>
                      {whyRecommendationText}
                    </p>
                  </div>

                  {/* Section 4: Predicted Outcome */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold font-display uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Predicted Outcome
                    </h3>
                    
                    <div className={`p-4 rounded-xl border space-y-3 ${
                      isDark ? "bg-white/5 border-white/10" : "bg-white border-[#efecf6]"
                    }`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium">Completion Probability</span>
                        <span className="font-mono font-bold text-[#5054b1]">
                          {recommendationApproved ? `${improvedCompletionProb}%` : `${currentCompletionProb}% → ${improvedCompletionProb}%`}
                        </span>
                      </div>

                      {/* Before / After Progress Bars */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>Current Schedule</span>
                            <span>{currentCompletionProb}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${currentCompletionProb}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>After Recommendation</span>
                            <span>{improvedCompletionProb}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${improvedCompletionProb}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Ask AI */}
                  <div className="space-y-3 border-t pt-5 dark:border-white/10">
                    <h3 className="text-xs font-bold font-display uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Ask AI Coach
                    </h3>

                    {/* Chat Messages */}
                    {chatHistory.length > 0 && (
                      <div className={`space-y-2 max-h-48 overflow-y-auto p-2.5 rounded-lg border text-[11px] ${
                        isDark ? "bg-black/20 border-white/5" : "bg-[#f5f2fb]/50 border-[#efecf6]"
                      }`}>
                        {chatHistory.map((chat, idx) => (
                          <div key={idx} className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`p-2 rounded-lg max-w-[85%] leading-relaxed ${
                              chat.sender === "user"
                                ? "bg-[#5054b1] text-white"
                                : isDark ? "bg-white/10 text-white" : "bg-white text-gray-800 border shadow-sm"
                            }`}>
                              {chat.text}
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    )}

                    {/* Quick Suggestions */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "What should I focus on today?",
                        "Which deadline is most at risk?",
                        "Can I finish everything before Friday?",
                        "How can I reduce cognitive load?"
                      ].map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickPrompt(prompt)}
                          className={`text-[10px] text-left px-2.5 py-1 rounded-full border hover:bg-[#5054b1] hover:text-white transition-all cursor-pointer ${
                            isDark 
                              ? "border-white/10 text-gray-300" 
                              : "border-[#efecf6] text-gray-600 bg-white"
                          }`}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>

                    {/* Chat Input Field */}
                    <form onSubmit={handleAskAI} className="flex gap-2 relative">
                      <input
                        type="text"
                        placeholder={chatLoading ? "AI Coach is thinking..." : "Ask AI Coach..."}
                        disabled={chatLoading}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className={`flex-1 text-xs px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#5054b1] pr-10 ${
                          isDark 
                            ? "bg-black/30 border-white/10 text-white" 
                            : "bg-white border-gray-300 text-gray-800"
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || chatLoading}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5054b1] disabled:text-gray-400 transition-colors p-1 flex items-center justify-center"
                        aria-label="Send message"
                      >
                        {chatLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#5054b1]" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </form>
                  </div>

                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}
