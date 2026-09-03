import React from "react";
import { 
  Sparkles, 
  RefreshCw, 
  Inbox, 
  Check, 
  Clock, 
  Trash2, 
  History, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { Task, ScheduleItem } from "../types";

interface DashboardViewProps {
  darkCalmMode: boolean;
  aiAdvice: { suggestion: string; predictedLoad: string; loading: boolean };
  fetchAiAdvice: () => void;
  tasks: Task[];
  filteredTasks: Task[];
  expandedTaskId: string | null;
  setExpandedTaskId: (id: string | null) => void;
  handleToggleTask: (id: string) => void;
  handleDeleteTask: (id: string, e: React.MouseEvent) => void;
  handleRestoreDeletedTask: (id: string) => void;
  handlePermanentDeleteTask: (id: string) => void;
  handleDirectAdd: (title: string) => void;
  setIsCaptureModalOpen: (open: boolean) => void;
  schedule: ScheduleItem[];
  handleToggleScheduleItem: (id: string) => void;
  deletedTasks: Task[];
  historyTab: "completed" | "deleted";
  setHistoryTab: React.Dispatch<React.SetStateAction<"completed" | "deleted">>;
  currentRisk: { level: string; color: string };
  userName?: string;
  onClearAllDeletedTasks: () => void;
}

export default function DashboardView({
  userName,
  darkCalmMode,
  aiAdvice,
  fetchAiAdvice,
  tasks,
  filteredTasks,
  expandedTaskId,
  setExpandedTaskId,
  handleToggleTask,
  handleDeleteTask,
  handleRestoreDeletedTask,
  handlePermanentDeleteTask,
  handleDirectAdd,
  setIsCaptureModalOpen,
  schedule,
  handleToggleScheduleItem,
  deletedTasks,
  historyTab,
  setHistoryTab,
  currentRisk,
  onClearAllDeletedTasks
}: DashboardViewProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      
      {/* Contextual intelligent advice strip */}
      <section className="mt-4 max-w-[1200px] mx-auto">
        <div className={`glass-panel rounded-xl p-3 px-5 flex flex-wrap items-center justify-between gap-4 border-l-4 border-[#5054b1] transition-colors duration-300 ${
          darkCalmMode ? "bg-[#181822]/90" : "bg-white/80"
        }`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-5 h-5 text-[#5054b1] animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
            <div className="text-left">
              <p className="text-xs font-sans">
                <span className="font-bold text-[#5054b1] dark:text-[#bfc1ff]">Assistant Recommendation:</span>{" "}
                {aiAdvice.loading ? (
                  <span className="text-[#72749b] italic animate-pulse">Consulting planning patterns with assistant...</span>
                ) : (
                  <span>{aiAdvice.suggestion}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Energy / cognitive prediction score */}
            <div className="flex items-center gap-3 border-r border-[#efecf6] dark:border-white/10 pr-4">
              <div className="text-right">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-[#72749b]">
                  Cognitive Burden Index
                </span>
                <span className="font-mono text-xs font-bold text-[#5054b1] dark:text-[#bfc1ff]">
                  {aiAdvice.predictedLoad}
                </span>
              </div>
              <div className="w-1.5 h-8 bg-[#efecf6] dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`w-full rounded-full transition-all duration-300 ${
                    aiAdvice.predictedLoad.includes("High") 
                      ? "bg-rose-500 h-4/5" 
                      : aiAdvice.predictedLoad.includes("Medium") 
                        ? "bg-amber-500 h-1/2" 
                        : "bg-emerald-500 h-1/4"
                  }`} 
                />
              </div>
            </div>

            {/* Accept Adjustment CTAs */}
            <div className="flex items-center gap-2 text-xs">
              <button 
                onClick={() => {
                  const suggestion = aiAdvice.suggestion || "";
                  const doubleQuotesMatch = suggestion.match(/"([^"]+)"/);
                  const singleQuotesMatch = suggestion.match(/'([^']+)'/);
                  const parsedTask = (doubleQuotesMatch && doubleQuotesMatch[1]) || 
                                     (singleQuotesMatch && singleQuotesMatch[1]) || 
                                     "Optimize Schedule Block";
                  handleDirectAdd(parsedTask);
                }}
                className="px-4 py-1.5 bg-[#4c51bb] hover:bg-[#373b97] active:scale-95 text-white rounded-lg font-sans font-medium transition-all"
              >
                Accept
              </button>
              <button 
                onClick={fetchAiAdvice}
                className="p-1 px-2.5 bg-[#f5f2fb] dark:bg-white/10 text-[#72749b] hover:text-[#010047] dark:hover:text-white rounded-lg font-sans font-medium hover:bg-[#e9e7f0] transition-all flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Adjust</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Greeting Header */}
      <section className="pt-2 pb-4 max-w-[1200px] mx-auto text-left">
        <div className="flex flex-col space-y-2">
          <h2 className="font-display text-4xl font-extrabold text-[#010047] dark:text-white tracking-tight">
            {getGreeting()}, {userName ? userName.split(" ")[0] : "User"}.
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="font-sans text-md text-[#72749b] font-medium">
                Your schedule index indicates your day is perfectly manageable.
              </p>
              <div className={`flex items-center gap-1.5 px-3 py-1 border rounded-full ${currentRisk.color}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                <span className="font-mono text-[9px] uppercase tracking-wider font-bold">
                  Risk Level: {currentRisk.level}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-emerald-700 dark:text-emerald-400 font-sans text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Tasks Completed: {tasks.filter(t => t.completed).length}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-3.5 py-1.5 rounded-xl text-amber-700 dark:text-amber-400 font-sans text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Tasks Pending: {tasks.filter(t => !t.completed).length}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Workspace */}
      <div className="max-w-[1200px] mx-auto grid grid-cols-12 gap-6">
        
        {/* Column 1: Priority Tasks Feed & Custom Quick Input */}
        <div className="col-span-12 lg:col-span-7 space-y-6 text-left">
          
          <div className={`glass-panel p-6 rounded-2xl border transition-colors ${
            darkCalmMode ? "bg-[#181822]/40" : "bg-white"
          }`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#010047] dark:text-white">
                  AI-Sorted Priorities
                </h3>
                <p className="text-[11px] text-[#72749b]">Computed sequentially based on current focus vectors</p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#72749b] bg-[#f5f2fb] dark:bg-white/5 px-2.5 py-1 rounded-full border border-[#efecf6] dark:border-white/5">
                Updated 2m ago
              </span>
            </div>

            {/* Task list list structure */}
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center rounded-xl border border-dashed border-[#efecf6] bg-[#fbf8ff]/30">
                  <Inbox className="w-12 h-12 text-[#c7c5d4] mx-auto mb-2" />
                  <p className="text-sm font-sans text-[#72749b]">No active priority tasks matched your search query.</p>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isExpanded = expandedTaskId === task.id;
                  return (
                    <div 
                      key={task.id}
                      className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                        task.completed 
                          ? "opacity-60 bg-[#fbf8ff]/50 dark:bg-black/10 border-[#efecf6]/40" 
                          : isExpanded 
                            ? "bg-white dark:bg-[#1c1c2b] shadow-md border-[#5054b1]" 
                            : "bg-white/50 dark:bg-[#181822]/80 hover:bg-white dark:hover:bg-[#1c1c2b] border-[#efecf6] dark:border-white/5 hover:shadow-sm"
                      }`}
                    >
                      {/* Color Tag Indicator */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                        task.score >= 90 
                          ? "bg-rose-500" 
                          : task.score >= 70 
                            ? "bg-[#5054b1]" 
                            : "bg-[#72749b]"
                      }`} />

                      <div 
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="p-4 pl-6 flex items-center gap-4 cursor-pointer select-none"
                      >
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTask(task.id);
                          }}
                          className={`w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center transition-all ${
                            task.completed 
                              ? "bg-[#5054b1] border-[#5054b1] text-white" 
                              : "border-[#72749b] hover:border-[#5054b1]"
                          }`}
                        >
                          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={`font-sans text-xs font-bold truncate ${
                            task.completed ? "line-through text-[#72749b]" : "text-[#010047] dark:text-white"
                          }`}>
                            {task.title}
                          </p>
                          <p className="font-sans text-[11px] text-[#72749b] truncate mt-0.5">
                            Goal Area: <span className="font-semibold text-[#010047] dark:text-[#bfc1ff]">{task.project}</span>
                            {task.nextStep && <> &bull; Next: <span className="text-[#5054b1] dark:text-cyan-400 font-medium">{task.nextStep}</span></>}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 text-right font-mono font-bold">
                          <div>
                            <span className={`block text-xs uppercase tracking-wider ${
                              task.completed 
                                ? "text-[#c7c5d4]" 
                                : task.score >= 90 ? "text-rose-600" : "text-[#5054b1] dark:text-[#bfc1ff]"
                            }`}>
                              Score: {task.score}
                            </span>
                            <div className="flex items-center justify-end gap-1 text-[9px] text-[#72749b] font-medium uppercase tracking-wider mt-0.5">
                              <Clock className="w-3 h-3 text-current" />
                              <span>{task.duration}</span>
                            </div>
                          </div>

                          <button 
                            onClick={(e) => handleDeleteTask(task.id, e)}
                            className="text-[#72749b] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-rose-50/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Accordion AI Explanation Logic */}
                      {isExpanded && (
                        <div className="px-6 pb-4 pt-1 border-t border-[#efecf6]/40 dark:border-white/5 bg-[#fbf8ff]/60 dark:bg-black/10 text-xs">
                          <div className="space-y-2 mt-2">
                            <div className="flex gap-2 p-3 bg-white dark:bg-[#181822] rounded-xl border border-[#efecf6] dark:border-white/5 shadow-inner">
                              <Sparkles className="w-4.5 h-4.5 text-[#5054b1] shrink-0 mt-0.5" />
                              <div>
                                <p className="font-mono text-[9px] uppercase tracking-wider text-[#5054b1] dark:text-cyan-400 font-bold">Priority Diagnostic Explanation</p>
                                <p className="text-[11px] leading-relaxed text-[#464652] dark:text-gray-300 font-sans mt-0.5">
                                  {task.explanation || "No dynamic priority analysis evaluated yet. Set goal bounds and request scoring advice to unlock counselor mapping."}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-4 pt-1 text-[11px] font-mono justify-between">
                              <div>
                                <span className="text-[#72749b]">Cognitive Overhead Class:</span>{" "}
                                <span className="text-[#010047] dark:text-white font-bold">{task.cognitiveLoad}</span>
                              </div>
                              <div>
                                <span className="text-[#72749b]">Action Path Guidance:</span>{" "}
                                <span className="text-[#5054b1] dark:text-cyan-300 font-bold">100% Focused Block</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>

            {/* Add Custom Inline Input Box as requested */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const target = e.currentTarget.elements.namedItem("inlineTaskName") as HTMLInputElement;
                if (target && target.value.trim()) {
                  handleDirectAdd(target.value);
                  target.value = "";
                }
              }}
              className="mt-4 flex items-center gap-2"
            >
              <input 
                id="inline-task-input"
                name="inlineTaskName"
                type="text" 
                placeholder="+ Quick capture custom task onto your active schedule..."
                className={`w-full px-4 py-2 border rounded-xl text-xs placeholder:text-[#72749b] dark:placeholder:text-[#bfc1ff] focus:outline-none focus:ring-2 focus:ring-[#5054b1] transition-all ${
                  darkCalmMode 
                    ? "bg-white/5 border-white/10 text-white focus:bg-[#1c1c2b]" 
                    : "bg-[#fbf8ff] border-[#efecf6] text-[#010047] focus:bg-white"
                }`}
              />
              <button 
                type="submit"
                className="p-2 py-2 px-3.5 bg-[#efecf6] hover:bg-[#5054b1] text-[#010047] hover:text-white rounded-xl transition-all font-sans text-xs font-semibold"
              >
                Add
              </button>
              <button 
                type="button"
                onClick={() => setIsCaptureModalOpen(true)}
                className="p-2 bg-gradient-to-tr from-[#5054b1] to-[#bfc1ff] text-white rounded-xl font-sans text-xs font-semibold"
                title="AI Parsing Interface Builder"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </form>

          </div>

          {/* Dashboard History Log portion */}
          <div className={`glass-panel p-6 rounded-2xl border transition-colors ${
            darkCalmMode ? "bg-[#181822]/40" : "bg-white"
          }`}>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#f5f2fb] dark:bg-white/5 rounded-xl text-[#5054b1]">
                  <History className="w-5 h-5 text-current" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#010047] dark:text-white">
                    History Logs
                  </h3>
                  <p className="text-[11px] text-[#72749b]">Review completed and recently deleted active tasks</p>
                </div>
              </div>

              {/* Tab switches */}
              <div className="flex items-center gap-3">
                {historyTab === "deleted" && deletedTasks.length > 0 && (
                  <button
                    onClick={onClearAllDeletedTasks}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
                    title="Permanently empty deleted tasks log"
                  >
                    Empty Trash
                  </button>
                )}
                <div className="flex bg-[#f5f2fb] dark:bg-white/5 p-1 rounded-xl">
                <button
                  onClick={() => setHistoryTab("completed")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all ${
                    historyTab === "completed"
                      ? "bg-white dark:bg-[#181822] text-[#010047] dark:text-white shadow-sm"
                      : "text-[#72749b] hover:text-[#010047] dark:hover:text-white"
                  }`}
                >
                  Completed Tasks ({tasks.filter(t => t.completed).length})
                </button>
                <button
                  onClick={() => setHistoryTab("deleted")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all ${
                    historyTab === "deleted"
                      ? "bg-white dark:bg-[#181822] text-[#010047] dark:text-white shadow-sm"
                      : "text-[#72749b] hover:text-[#010047] dark:hover:text-white"
                  }`}
                >
                  Deleted Tasks ({deletedTasks.length})
                </button>
              </div>
            </div>
          </div>

            {/* History Content */}
            {historyTab === "completed" ? (
              <div className="space-y-2">
                {tasks.filter(t => t.completed).length === 0 ? (
                  <div className="py-8 text-center rounded-xl border border-dashed border-[#efecf6] dark:border-white/5 bg-[#fbf8ff]/10">
                    <p className="text-xs text-[#72749b] font-sans">No completed tasks yet. Finish some focus blocks to populate your log!</p>
                  </div>
                ) : (
                  tasks.filter(t => t.completed).map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-[#fbf8ff]/40 dark:bg-black/10 border border-[#efecf6]/40 flex items-center justify-between text-xs transition-all hover:bg-white/60 dark:hover:bg-black/20"
                    >
                      <div>
                        <span className="font-semibold text-[#010047] dark:text-white line-through opacity-70">
                          {task.title}
                        </span>
                        <span className="text-[10px] text-[#72749b] ml-2 font-mono">
                          ({task.project})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          Completed
                        </span>
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className="text-xs font-bold text-[#5054b1] dark:text-cyan-400 hover:underline"
                          title="Re-open/Mark as active"
                        >
                          Re-open
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {deletedTasks.length === 0 ? (
                  <div className="py-8 text-center rounded-xl border border-dashed border-[#efecf6] dark:border-white/5 bg-[#fbf8ff]/10">
                    <p className="text-xs text-[#72749b] font-sans">No deleted tasks in history.</p>
                  </div>
                ) : (
                  deletedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-rose-50/10 dark:bg-rose-950/5 border border-rose-100/20 dark:border-rose-950/10 flex items-center justify-between text-xs transition-all hover:bg-rose-50/20"
                    >
                      <div>
                        <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                          {task.title}
                        </span>
                        <span className="text-[10px] text-[#72749b] ml-2 font-mono">
                          ({task.project})
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md">
                          Deleted
                        </span>
                        <button
                          onClick={() => handleRestoreDeletedTask(task.id)}
                          className="text-xs font-bold text-[#5054b1] dark:text-cyan-400 hover:underline"
                          title="Restore to Active list"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDeleteTask(task.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50/20"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>

        {/* Column 2: Today's Interactive Schedule */}
        <div className="col-span-12 lg:col-span-5 text-left">
          <div className={`border p-6 rounded-2xl sticky top-24 shadow-sm transition-colors ${
            darkCalmMode ? "bg-[#181822]/90 border-white/5" : "bg-white border-[#efecf6]"
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-display text-lg font-bold text-[#010047] dark:text-white">
                  Today's Schedule
                </h3>
                <p className="text-[11px] text-[#72749b]">Consolidated visual agenda context</p>
              </div>
              <div className="flex gap-1.5">
                <button className="p-1 hover:bg-[#efecf6] dark:hover:bg-white/10 rounded-full transition-colors text-[#72749b]">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-[#efecf6] dark:hover:bg-white/10 rounded-full transition-colors text-[#72749b]">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vertical Timeline Track */}
            <div className="relative space-y-4">
              <div className="absolute left-[39px] top-2 bottom-2 w-0.5 bg-[#efecf6] dark:bg-white/10" />

              {schedule.map((item) => {
                const isNowBlock = item.isNow;
                return (
                  <div 
                    key={item.id} 
                    className="flex gap-6 relative group"
                  >
                    {/* Hour tag label */}
                    <div className="w-10 text-right">
                      <span className={`font-mono text-[10px] font-semibold leading-none ${
                        isNowBlock ? "text-[#5054b1] dark:text-cyan-400" : "text-[#72749b]"
                      }`}>
                        {item.time}
                      </span>
                    </div>

                    {/* Interactive bullet status */}
                    <div className="absolute left-[35px] top-1.5 z-10">
                      {isNowBlock ? (
                        <div className="w-4.5 h-4.5 rounded-full bg-white dark:bg-[#181822] border-4 border-[#5054b1] shadow-sm animate-pulse flex items-center justify-center -translate-x-1" />
                      ) : (
                        <button 
                          onClick={() => handleToggleScheduleItem(item.id)}
                          className={`w-2 h-2 rounded-full ring-4 ring-white dark:ring-[#181822] transition-all ${
                            item.completed 
                              ? "bg-emerald-500 hover:ring-[#efecf6]" 
                              : "bg-[#72749b]/40 hover:bg-[#5054b1]"
                          }`} 
                        />
                      )}
                    </div>

                    {/* Content Block Container */}
                    <div className="flex-1">
                      {isNowBlock ? (
                        <div className="border-t-2 border-[#5054b1] border-dashed pt-3 pb-1">
                          <p className="font-mono text-[10px] text-[#5054b1] dark:text-cyan-400 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                            <span>Now Playing: Review Focus Block</span>
                            <Sparkles className="w-3.5 h-3.5 animate-spin text-[#5054b1]" />
                          </p>
                        </div>
                      ) : (
                        <div className={`p-4 rounded-xl border transition-all duration-200 ${
                          item.completed 
                            ? "bg-[#fbf8ff]/60 dark:bg-black/20 border-[#efecf6] dark:border-white/5 opacity-65" 
                            : "bg-[#f5f2fb]/50 dark:bg-white/5 border-transparent hover:border-[#efecf6]"
                        }`}>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className={`font-sans text-xs font-bold leading-tight ${
                                item.completed ? "line-through text-[#72749b]" : "text-[#010047] dark:text-white"
                              }`}>
                                {item.title}
                              </p>
                              <p className="font-sans text-[11px] text-[#72749b] leading-tight mt-1">
                                {item.subtitle}
                              </p>
                            </div>
                            <button 
                              onClick={() => handleToggleScheduleItem(item.id)}
                              className="p-1 rounded hover:bg-[#efecf6] text-[#72749b] dark:hover:bg-white/10"
                            >
                              <Check className={`w-3.5 h-3.5 transition-opacity ${item.completed ? "text-emerald-500 opacity-100" : "opacity-30 group-hover:opacity-100"}`} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}

            </div>

            {/* Multi-Attendee Schedule Sub-Banner */}
            <div className="mt-6 pt-6 border-t border-[#efecf6] dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <img 
                    className="w-7 h-7 rounded-full border-2 border-white object-cover" 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" 
                    alt="Colleague profile photo" 
                  />
                  <img 
                    className="w-7 h-7 rounded-full border-2 border-white object-cover" 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80" 
                    alt="Product manager profile photo" 
                  />
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-[#efecf6] text-[9px] flex items-center justify-center font-bold text-[#72749b]">
                    +3
                  </div>
                </div>
                <p className="font-sans text-[11px] text-[#72749b] italic">
                  Next shared session starts in 25 minutes.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
