import React from "react";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  ArrowRight, 
  Sparkles, 
  Coffee, 
  AlertTriangle, 
  Loader2 
} from "lucide-react";
import { DailyInsight } from "../types";

interface PlannerViewProps {
  darkCalmMode: boolean;
  plannerView: "day" | "week" | "month";
  setPlannerView: (view: "day" | "week" | "month") => void;
  isCalendarConnected: boolean;
  setIsCalendarConnected: (val: boolean) => void;
  connectedSources: string[];
  setConnectedSources: React.Dispatch<React.SetStateAction<string[]>>;
  appliedOptimizations: string[];
  setAppliedOptimizations: React.Dispatch<React.SetStateAction<string[]>>;
  showConnectionMenu: boolean;
  setShowConnectionMenu: (val: boolean) => void;
  isConnecting: boolean;
  setIsConnecting: (val: boolean) => void;
}

export default function PlannerView({
  darkCalmMode,
  plannerView,
  setPlannerView,
  isCalendarConnected,
  setIsCalendarConnected,
  connectedSources,
  setConnectedSources,
  appliedOptimizations,
  setAppliedOptimizations,
  showConnectionMenu,
  setShowConnectionMenu,
  isConnecting,
  setIsConnecting
}: PlannerViewProps) {
  return (
    <div className="max-w-[1200px] mx-auto text-left space-y-6 pt-4">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col space-y-1">
        <h2 className="font-display text-2xl font-bold text-[#010047] dark:text-white">Your Planner</h2>
        <p className="text-sm text-[#72749b]">
          Manage tasks, deadlines, meetings, and focus sessions in one unified schedule.
        </p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column - 70% (8 cols) - Weekly Calendar View */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          
          {/* Calendar Workspace Controls */}
          <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-colors ${
            darkCalmMode ? "bg-[#181822]/90 border-white/10" : "bg-white border-[#efecf6]"
          }`}>
            {/* View Toggles */}
            <div className="flex bg-[#f5f2fb] dark:bg-white/5 p-1 rounded-xl">
              {(["day", "week", "month"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setPlannerView(view)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    plannerView === view
                      ? "bg-white dark:bg-[#1c1c2b] text-[#010047] dark:text-white shadow-sm"
                      : "text-[#72749b] hover:text-[#010047] dark:hover:text-white"
                  }`}
                >
                  {view} View
                </button>
              ))}
            </div>

            {/* Calendar Source Indicators/Toggles */}
            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">Visible Calendars:</span>
              <label className="flex items-center gap-1.5 cursor-pointer font-sans text-gray-600 dark:text-gray-300">
                <input 
                  type="checkbox" 
                  checked={!isCalendarConnected || connectedSources.includes("google")} 
                  disabled={!isCalendarConnected}
                  onChange={() => {
                    if (connectedSources.includes("google")) {
                      setConnectedSources(prev => prev.filter(s => s !== "google"));
                    } else {
                      setConnectedSources(prev => [...prev, "google"]);
                    }
                  }}
                  className="w-3.5 h-3.5 accent-[#5054b1]" 
                />
                <span>Google</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-sans text-gray-600 dark:text-gray-300">
                <input 
                  type="checkbox" 
                  checked={!isCalendarConnected || connectedSources.includes("outlook")} 
                  disabled={!isCalendarConnected}
                  onChange={() => {
                    if (connectedSources.includes("outlook")) {
                      setConnectedSources(prev => prev.filter(s => s !== "outlook"));
                    } else {
                      setConnectedSources(prev => [...prev, "outlook"]);
                    }
                  }}
                  className="w-3.5 h-3.5 accent-cyan-500" 
                />
                <span>Outlook</span>
              </label>
            </div>
          </div>

          {/* Main Calendar Grid Area */}
          <div className="relative min-h-[600px] rounded-2xl overflow-hidden border border-[#efecf6] dark:border-white/5">
            
            {/* Background Calendar Grid (Faded when disconnected) */}
            <div className={`p-6 w-full h-full flex flex-col transition-all duration-300 ${
              !isCalendarConnected ? "opacity-25 blur-[1px]" : "opacity-100"
            } ${
              darkCalmMode ? "bg-[#181822]/40" : "bg-white"
            }`}>
              {plannerView === "week" && (
                <div className="flex-1 flex flex-col space-y-4">
                  {/* Days Header */}
                  <div className="grid grid-cols-5 gap-4 border-b border-gray-100 dark:border-white/5 pb-3">
                    {["MON", "TUE", "WED", "THU", "FRI"].map((day, i) => (
                      <div key={day} className="text-center font-mono text-[10px] text-gray-400 font-bold">
                        {day}<br/>
                        <span className="text-xs font-sans text-gray-600 dark:text-gray-300 font-normal">June {22 + i}</span>
                      </div>
                    ))}
                  </div>

                  {/* Unified Timeline Grid Columns */}
                  <div className="grid grid-cols-5 gap-4 flex-1">
                    
                    {/* MONDAY COLUMN */}
                    <div className="space-y-3">
                      {connectedSources.includes("google") && (
                        <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 text-xs">
                          <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-blue-500">Google Calendar</span>
                          <span className="font-bold block mt-0.5">Strategic Alignment</span>
                          <span className="text-[10px] block mt-0.5">09:00 AM - 10:30 AM</span>
                        </div>
                      )}

                      {(!appliedOptimizations.includes("deepFocus") && !appliedOptimizations.includes("optimizeWeek")) ? (
                        <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-xs">
                          <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-amber-500 font-bold">Task (Conflict Warning)</span>
                          <span className="font-bold block mt-0.5">Weekly Review</span>
                          <span className="text-[10px] block mt-0.5">10:00 AM</span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl border border-dashed border-gray-300 dark:border-white/10 text-gray-400 text-center text-[10px]">
                          Weekly Review Rescheduled
                        </div>
                      )}

                      {connectedSources.includes("outlook") && (
                        <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 text-xs">
                          <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-cyan-500">Outlook</span>
                          <span className="font-bold block mt-0.5">Project Sync</span>
                          <span className="text-[10px] block mt-0.5">
                            {appliedOptimizations.includes("optimizeWeek") ? "04:00 PM" : "02:00 PM"}
                          </span>
                        </div>
                      )}

                      {(appliedOptimizations.includes("deepFocus") || appliedOptimizations.includes("optimizeWeek")) && (
                        <div className="p-3 rounded-xl border border-[#5054b1]/20 bg-[#5054b1]/5 text-[#5054b1] dark:text-[#bfc1ff] text-xs">
                          <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-[#5054b1]">AI Focus Block</span>
                          <span className="font-bold block mt-0.5">Weekly Review</span>
                          <span className="text-[10px] block mt-0.5">04:00 PM</span>
                        </div>
                      )}
                    </div>

                    {/* TUESDAY COLUMN */}
                    <div className="space-y-3">
                      {(appliedOptimizations.includes("energyMismatch") || appliedOptimizations.includes("optimizeWeek")) && (
                        <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 text-xs">
                          <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-indigo-500 font-bold">Optimized Task</span>
                          <span className="font-bold block mt-0.5">Complex Report</span>
                          <span className="text-[10px] block mt-0.5">09:00 AM</span>
                        </div>
                      )}

                      {connectedSources.includes("google") && (
                        <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 text-xs">
                          <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-blue-500">Google Calendar</span>
                          <span className="font-bold block mt-0.5">Client Feedback Review</span>
                          <span className="text-[10px] block mt-0.5">11:00 AM - 12:00 PM</span>
                        </div>
                      )}

                      {(!appliedOptimizations.includes("energyMismatch") && !appliedOptimizations.includes("optimizeWeek")) ? (
                        <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs">
                          <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-rose-500">Energy Mismatch</span>
                          <span className="font-bold block mt-0.5">Complex Report</span>
                          <span className="text-[10px] block mt-0.5">05:00 PM</span>
                        </div>
                      ) : (
                        appliedOptimizations.includes("energyMismatch") && (
                          <div className="p-2.5 rounded-xl border border-dashed border-gray-300 dark:border-white/10 text-gray-400 text-center text-[10px]">
                            Moved to peak energy block
                          </div>
                        )
                      )}
                    </div>

                    {/* WEDNESDAY COLUMN */}
                    <div className="space-y-3">
                      {(appliedOptimizations.includes("unscheduledTask") || appliedOptimizations.includes("optimizeWeek")) ? (
                        <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400 text-xs">
                          <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-purple-500 font-bold">AI Scheduled Task</span>
                          <span className="font-bold block mt-0.5">Portfolio Review</span>
                          <span className="text-[10px] block mt-0.5">10:00 AM</span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl border border-dashed border-gray-200 dark:border-white/5 text-gray-300 dark:text-gray-600 text-center text-[10px] italic">
                          No slots scheduled
                        </div>
                      )}

                      {connectedSources.includes("outlook") && (
                        <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 text-xs">
                          <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-cyan-500 font-bold">Outlook</span>
                          <span className="font-bold block mt-0.5">Creative Brainstorming</span>
                          <span className="text-[10px] block mt-0.5">01:00 PM - 02:30 PM</span>
                        </div>
                      )}
                    </div>

                    {/* THURSDAY COLUMN */}
                    <div className="space-y-3">
                      {(appliedOptimizations.includes("deadlineRisk") || appliedOptimizations.includes("optimizeWeek")) ? (
                        <div className="p-3 rounded-xl border border-[#5054b1]/20 bg-[#5054b1]/5 text-[#5054b1] dark:text-[#bfc1ff] text-xs">
                          <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-[#5054b1]">AI Focus Block</span>
                          <span className="font-bold block mt-0.5">UX Audit Preparation</span>
                          <span className="text-[10px] block mt-0.5">10:00 AM - 12:00 PM</span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl border border-dashed border-gray-200 dark:border-white/5 text-gray-300 dark:text-gray-600 text-center text-[10px] italic">
                          No slots scheduled
                        </div>
                      )}
                    </div>

                    {/* FRIDAY COLUMN */}
                    <div className="space-y-3">
                      {(appliedOptimizations.includes("deadlineRisk") || appliedOptimizations.includes("optimizeWeek")) && (
                        <div className="p-3 rounded-xl border border-[#5054b1]/20 bg-[#5054b1]/5 text-[#5054b1] dark:text-[#bfc1ff] text-xs">
                          <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-[#5054b1]">AI Focus Block</span>
                          <span className="font-bold block mt-0.5">UX Audit Preparation</span>
                          <span className="text-[10px] block mt-0.5">11:00 AM - 01:00 PM</span>
                        </div>
                      )}

                      {appliedOptimizations.includes("recoveryBuffer") && (
                        <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs">
                          <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-emerald-500 font-bold">Recovery Buffer</span>
                          <span className="font-bold block mt-0.5">Reserved Downtime</span>
                          <span className="text-[10px] block mt-0.5">02:00 PM - 03:30 PM</span>
                        </div>
                      )}

                      {connectedSources.includes("notion") && (
                        <div className="p-3 rounded-xl border border-pink-500/20 bg-pink-500/5 text-pink-600 dark:text-pink-400 text-xs">
                          <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-pink-500 font-bold">Notion Deadline</span>
                          <span className="font-bold block mt-0.5">UX Audit Due</span>
                          <span className="text-[10px] block mt-0.5">05:00 PM</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {plannerView === "day" && (
                <div className="space-y-4">
                  <div className="font-bold text-sm text-[#010047] dark:text-white border-b pb-2">Monday, June 22</div>
                  <div className="space-y-2.5">
                    <div className="flex gap-4 p-3 rounded-lg bg-blue-500/5 text-blue-600 text-xs">
                      <span className="font-mono w-20 text-right">09:00 AM</span>
                      <span>Google Calendar: Strategic Alignment Meeting</span>
                    </div>
                  </div>
                </div>
              )}

              {plannerView === "month" && (
                <div className="grid grid-cols-7 gap-2 text-center text-xs">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="font-bold font-mono text-gray-400">{d}</div>
                  ))}
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="p-4 border border-gray-100 dark:border-white/5 rounded-lg text-center text-gray-300">
                      {i + 1}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Empty Calendar State Overlay */}
            {!isCalendarConnected && (
              <div className="absolute inset-0 flex items-center justify-center p-6 bg-transparent z-10">
                <div className={`p-8 rounded-2xl border shadow-xl max-w-md w-full text-center space-y-5 animate-in zoom-in-95 duration-200 ${
                  darkCalmMode 
                    ? "bg-[#181822] border-white/10 text-white" 
                    : "bg-white border-[#efecf6] text-[#010047]"
                }`}>
                  {isConnecting ? (
                    /* Connecting State */
                    <div className="py-6 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="w-10 h-10 text-[#5054b1] animate-spin" />
                      <div>
                        <h4 className="font-display font-bold text-sm">Authorizing OAuth Integration...</h4>
                        <p className="text-[11px] text-gray-400 mt-1">Connecting account securely using secure callbacks</p>
                      </div>
                    </div>
                  ) : !showConnectionMenu ? (
                    /* Primary Onboarding State */
                    <>
                      <div className="w-14 h-14 rounded-full bg-[#f5f2fb] dark:bg-white/5 flex items-center justify-center text-[#72749b] mx-auto">
                        <Calendar className="w-6 h-6 text-current" />
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-display font-bold text-base">Connect calendar for view</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed px-4">
                          Connect your Google Calendar or Outlook Calendar to view events, meetings, deadlines, and AI scheduled focus blocks.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowConnectionMenu(true)}
                        className="px-6 py-2.5 bg-[#5054b1] hover:bg-[#373b97] text-white rounded-xl font-sans text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer min-h-[44px]"
                      >
                        Connect Calendar
                      </button>
                    </>
                  ) : (
                    /* Connection Submenu Options */
                    <>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/5">
                        <h4 className="font-display font-bold text-sm text-[#010047] dark:text-white">Connect Calendar Service</h4>
                        <button 
                          onClick={() => setShowConnectionMenu(false)}
                          className="p-1 hover:bg-black/10 rounded-full text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-4 pt-2 text-left">
                        {/* Google Calendar option */}
                        <div className="p-4 border border-[#efecf6] dark:border-white/10 rounded-xl bg-white dark:bg-[#1f1f2e] space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              <span className="font-bold text-xs text-gray-800 dark:text-white">Google Calendar</span>
                            </div>
                            <span className="text-[9px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">OAuth 2.0</span>
                          </div>
                          <div className="space-y-1 pl-3 border-l-2 border-blue-500/20">
                            <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Permissions requested:</p>
                            <div className="space-y-0.5 text-[11px] text-gray-600 dark:text-gray-300">
                              <div className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Read Events</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Create Events</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Update Events</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setIsConnecting(true);
                              setTimeout(() => {
                                setIsConnecting(false);
                                setIsCalendarConnected(true);
                                setConnectedSources(["google"]);
                                setShowConnectionMenu(false);
                              }, 1200);
                            }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
                          >
                            <span>Connect Google Calendar</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Outlook Calendar option */}
                        <div className="p-4 border border-[#efecf6] dark:border-white/10 rounded-xl bg-white dark:bg-[#1f1f2e] space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-cyan-500" />
                              <span className="font-bold text-xs text-gray-800 dark:text-white">Outlook Calendar</span>
                            </div>
                            <span className="text-[9px] bg-cyan-500/10 text-cyan-600 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">OAuth 2.0</span>
                          </div>
                          <div className="space-y-1 pl-3 border-l-2 border-cyan-500/20">
                            <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Permissions requested:</p>
                            <div className="space-y-0.5 text-[11px] text-gray-600 dark:text-gray-300">
                              <div className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Read Events</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Create Events</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Update Events</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setIsConnecting(true);
                              setTimeout(() => {
                                setIsConnecting(false);
                                setIsCalendarConnected(true);
                                setConnectedSources(["outlook"]);
                                setShowConnectionMenu(false);
                              }, 1200);
                            }}
                            className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
                          >
                            <span>Connect Outlook Calendar</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Right Column - 30% (4 cols / ~320px width) - AI suggestions panel */}
        <div className="col-span-12 lg:col-span-4 w-full max-w-[340px] space-y-6">
          
          <div className={`p-5 rounded-2xl border transition-all h-full flex flex-col ${
            darkCalmMode ? "bg-[#181822] border-white/10" : "bg-white border-[#efecf6]"
          }`}>
            <h4 className="font-display font-bold text-sm text-[#010047] dark:text-white border-b pb-3 mb-4 text-left">
              AI Suggestions
            </h4>

            {!isCalendarConnected ? (
              /* Suggestions Empty Onboarding State */
              <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#5054b1]/10 flex items-center justify-center text-[#5054b1]">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                
                <div className="space-y-1.5">
                  <h5 className="font-display font-bold text-xs text-gray-800 dark:text-white">AI suggestions will appear here</h5>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Once your calendar is connected, AI will analyze your schedule and provide smart recommendations to optimize productivity.
                  </p>
                </div>
              </div>
            ) : (
              /* Connected Active AI Recommendations */
              <div className="space-y-5 text-left">
                
                {/* Action Area CTAs */}
                <div className="space-y-2 border-b border-gray-100 dark:border-white/5 pb-4">
                  {appliedOptimizations.includes("optimizeWeek") ? (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4" strokeWidth={3} />
                      <span>Week Optimized Successfully</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAppliedOptimizations(prev => [...prev, "optimizeWeek", "deepFocus", "energyMismatch", "unscheduledTask", "deadlineRisk"]);
                      }}
                      className="w-full py-2.5 px-4 bg-[#5054b1] hover:bg-[#373b97] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow transition-all active:scale-95"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-300" />
                      <span>Optimize My Week</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setAppliedOptimizations(prev => [...prev, "recoveryBuffer"]);
                    }}
                    className={`w-full py-2 px-4 border rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      appliedOptimizations.includes("recoveryBuffer")
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                        : "border-[#efecf6] dark:border-white/10 hover:bg-black/5 text-[#5054b1] dark:text-[#bfc1ff]"
                    }`}
                  >
                    <Coffee className="w-4 h-4 text-emerald-500" />
                    <span>{appliedOptimizations.includes("recoveryBuffer") ? "Recovery Buffer Reserved" : "Create Recovery Buffer"}</span>
                  </button>
                </div>

                {/* Proactive recommendation cards list */}
                <div className="space-y-4 overflow-y-auto max-h-[480px] pr-1">
                  
                  {/* 1. Deep Focus Conflict */}
                  {!appliedOptimizations.includes("deepFocus") && !appliedOptimizations.includes("optimizeWeek") && (
                    <div className="p-4 rounded-xl border border-[#efecf6] dark:border-white/5 space-y-2.5 text-xs bg-rose-500/[0.02]">
                      <div className="flex items-center gap-1.5 text-rose-500 font-bold border-b border-rose-500/10 pb-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Problem: Deep Focus Conflict</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Explanation</p>
                        <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                          Your Weekly Review overlaps with a protected focus block.
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-[10px] leading-tight border border-gray-100 dark:border-white/5">
                        <span className="font-semibold block text-[#5054b1] dark:text-cyan-400">Recommendation:</span> Move Weekly Review to 4 PM.
                      </div>
                      <div className="flex justify-between items-center text-[10px] pt-1 text-gray-400 font-mono">
                        <span>Impact: +90 min focus</span>
                        <button
                          onClick={() => setAppliedOptimizations(prev => [...prev, "deepFocus"])}
                          className="px-2.5 py-1.5 bg-[#5054b1] hover:bg-[#373b97] text-white rounded font-bold cursor-pointer font-sans"
                        >
                          Apply Change
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. Energy Mismatch */}
                  {!appliedOptimizations.includes("energyMismatch") && !appliedOptimizations.includes("optimizeWeek") && (
                    <div className="p-4 rounded-xl border border-[#efecf6] dark:border-white/5 space-y-2.5 text-xs bg-amber-500/[0.02]">
                      <div className="flex items-center gap-1.5 text-amber-500 font-bold border-b border-amber-500/10 pb-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Problem: Energy Mismatch</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Explanation</p>
                        <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                          Complex report scheduled at 5 PM. Historical data shows analytical performance drops after 4 PM.
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-[10px] leading-tight border border-gray-100 dark:border-white/5">
                        <span className="font-semibold block text-amber-500">Recommendation:</span> Move to tomorrow at 9 AM.
                      </div>
                      <div className="flex justify-between items-center text-[10px] pt-1 text-gray-400 font-mono">
                        <span>Impact: 18% faster speed</span>
                        <button
                          onClick={() => setAppliedOptimizations(prev => [...prev, "energyMismatch"])}
                          className="px-2.5 py-1.5 bg-[#5054b1] hover:bg-[#373b97] text-white rounded font-bold cursor-pointer font-sans"
                        >
                          Accept Recommendation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. Unscheduled Task */}
                  {!appliedOptimizations.includes("unscheduledTask") && !appliedOptimizations.includes("optimizeWeek") && (
                    <div className="p-4 rounded-xl border border-[#efecf6] dark:border-white/5 space-y-2.5 text-xs bg-[#5054b1]/[0.02]">
                      <div className="flex items-center gap-1.5 text-[#5054b1] dark:text-[#bfc1ff] font-bold border-b border-[#5054b1]/10 pb-1">
                        <Sparkles className="w-4 h-4" />
                        <span>Problem: Unscheduled Task</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Explanation</p>
                        <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                          Portfolio Review has no scheduled work session.
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-[10px] leading-tight border border-gray-100 dark:border-white/5">
                        <span className="font-semibold block text-[#5054b1] dark:text-[#bfc1ff]">Recommendation:</span> Schedule Automatically for Wed 10 AM.
                      </div>
                      <div className="flex justify-between items-center text-[10px] pt-1 text-gray-400 font-mono">
                        <span>Impact: Clear focus slot</span>
                        <button
                          onClick={() => setAppliedOptimizations(prev => [...prev, "unscheduledTask"])}
                          className="px-2.5 py-1.5 bg-[#5054b1] hover:bg-[#373b97] text-white rounded font-bold cursor-pointer font-sans"
                        >
                          Schedule Automatically
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. Deadline Risk */}
                  {!appliedOptimizations.includes("deadlineRisk") && !appliedOptimizations.includes("optimizeWeek") && (
                    <div className="p-4 rounded-xl border border-[#efecf6] dark:border-white/5 space-y-2.5 text-xs bg-rose-500/[0.02]">
                      <div className="flex items-center gap-1.5 text-rose-500 font-bold border-b border-rose-500/10 pb-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Problem: Deadline Risk</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Explanation</p>
                        <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                          UX Audit due Friday. Current schedule provides only 1.5 hours of focus time.
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-[10px] leading-tight border border-gray-100 dark:border-white/5">
                        <span className="font-semibold block text-[#5054b1] dark:text-cyan-400">Recommendation:</span> Create two additional focus blocks (4 hours total).
                      </div>
                      <div className="flex justify-between items-center text-[10px] pt-1 text-gray-400 font-mono">
                        <span>Impact: Meets deadline</span>
                        <button
                          onClick={() => setAppliedOptimizations(prev => [...prev, "deadlineRisk"])}
                          className="px-2.5 py-1.5 bg-[#5054b1] hover:bg-[#373b97] text-white rounded-lg font-bold cursor-pointer font-sans"
                        >
                          Create Schedule
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* Disconnect trigger */}
                <button
                  onClick={() => {
                    setIsCalendarConnected(false);
                    setConnectedSources([]);
                    setAppliedOptimizations([]);
                  }}
                  className="w-full text-center text-xs text-gray-400 hover:text-rose-500 transition-colors py-2 border border-dashed border-gray-200 dark:border-white/5 rounded-xl cursor-pointer"
                >
                  Disconnect Calendars
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
