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
}

export default function AIAssistantDrawer({
  tasks,
  schedule,
  setSchedule,
  isDark,
  onOpenCaptureModal
}: AIAssistantDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [recommendationApproved, setRecommendationApproved] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

    // Focus the first element when open
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
    // Simulate cognitive workload analysis
    setTimeout(() => {
      setLoading(false);
    }, 1200);
  };

  const handleClose = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Close when clicking backdrop/outside drawer
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
      handleClose();
    }
  };

  const handleApproveReschedule = () => {
    setSchedule(prev => 
      prev.map(item => {
        if (item.title === "Project Sync" || item.title.includes("Project Sync")) {
          return {
            ...item,
            time: "16:00",
            subtitle: "Rescheduled by AI Coach to optimize cognitive flow"
          };
        }
        return item;
      })
    );
    setRecommendationApproved(true);
  };

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatHistory(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");

    // Simulate AI response based on questions
    setTimeout(() => {
      let aiResponse = "I'm analyzing your current timeline. Let's optimize your workload to minimize switches.";
      const lower = userMsg.toLowerCase();
      if (lower.includes("focus") || lower.includes("today")) {
        aiResponse = "Today you should focus on 'Finalize Q3 Performance Review'. It demands peak executive attention. Start in the morning block.";
      } else if (lower.includes("deadline") || lower.includes("risk")) {
        aiResponse = "Your 'UX Evaluation Audit' target on July 1st is currently at risk due to a lack of dedicated focus blocks next week.";
      } else if (lower.includes("friday") || lower.includes("finish")) {
        aiResponse = "Yes, but you must resolve the double-booking tomorrow afternoon to stay on track without working late.";
      } else if (lower.includes("cognitive") || lower.includes("load")) {
        aiResponse = "To reduce cognitive load, bundle minor admin tasks like 'Organize Workspace Files' into a single 20-minute slot at the end of the day.";
      }

      setChatHistory(prev => [...prev, { sender: "ai", text: aiResponse }]);
    }, 800);
  };

  const handleQuickPrompt = (promptText: string) => {
    setChatHistory(prev => [...prev, { sender: "user", text: promptText }]);
    setTimeout(() => {
      let aiResponse = "Checking workload metrics...";
      const lower = promptText.toLowerCase();
      if (lower.includes("focus")) {
        aiResponse = "Today you should focus on 'Finalize Q3 Performance Review'. It demands peak executive attention. Start in the morning block.";
      } else if (lower.includes("deadline")) {
        aiResponse = "Your 'UX Evaluation Audit' target on July 1st is currently at risk due to a lack of dedicated focus blocks next week.";
      } else if (lower.includes("finish")) {
        aiResponse = "Yes, but you must resolve the double-booking tomorrow afternoon to stay on track without working late.";
      } else if (lower.includes("reduce")) {
        aiResponse = "To reduce cognitive load, bundle minor admin tasks like 'Organize Workspace Files' into a single 20-minute slot at the end of the day.";
      }
      setChatHistory(prev => [...prev, { sender: "ai", text: aiResponse }]);
    }, 700);
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const hasTasks = activeTasks.length > 0 || schedule.length > 0;

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
                      <div className="text-[10px] font-mono text-rose-500 font-bold">Risk Score: 82</div>
                      <div className="text-[10px] text-amber-500 font-semibold">High Cognitive Load</div>
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
                        High risk of overload between 2–4 PM. Three overlapping meetings and a high-focus task are competing for the same window. This may reduce task completion probability.
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
                          <span>Recommendation Approved: Moved Project Sync to 4 PM.</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold block text-xs">Move Project Sync from 2 PM to 4 PM</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 block">
                              Expected impact:
                            </span>
                            <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-gray-500 dark:text-gray-400 text-[10px]">
                              <li>Reduce overload</li>
                              <li>Recover 90 minutes</li>
                              <li>Increase focus score</li>
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
                        <button
                          className="flex-1 py-2 px-3 border border-gray-300 dark:border-white/10 hover:bg-black/5 rounded-lg text-[11px] font-semibold text-gray-500 dark:text-gray-300 transition-all min-h-[36px]"
                        >
                          View Details
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
                      Based on your historical productivity patterns, deep work tasks perform best during morning hours. The current schedule creates multiple context switches. Rescheduling increases completion probability.
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
                          {recommendationApproved ? "88%" : "63% → 88%"}
                        </span>
                      </div>

                      {/* Before / After Progress Bars */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>Current Schedule</span>
                            <span>63%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: "63%" }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>After Recommendation</span>
                            <span>88%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: "88%" }} />
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
                        placeholder="Ask AI Coach..."
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
                        disabled={!chatInput.trim()}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5054b1] disabled:text-gray-400 transition-colors p-1"
                        aria-label="Send message"
                      >
                        <Send className="w-4 h-4" />
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
