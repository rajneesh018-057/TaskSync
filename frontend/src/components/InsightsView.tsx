import React from "react";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { DailyInsight } from "../types";

interface InsightsViewProps {
  darkCalmMode: boolean;
  insights: DailyInsight[];
  cognitiveInsights: {
    focusDiagnostic: string;
    restAssessment: string;
    cognitiveCapacity: number;
    loading: boolean;
  };
  onRefresh: () => void;
}

export default function InsightsView({
  darkCalmMode,
  insights,
  cognitiveInsights,
  onRefresh
}: InsightsViewProps) {
  return (
    <div className="max-w-[850px] mx-auto text-left space-y-6 pt-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex flex-col space-y-1">
          <h3 className="font-display text-2xl font-bold text-[#010047] dark:text-white">Active Calm Cognitive Telemetry</h3>
          <p className="text-sm text-[#72749b]">Observe visual indicators mapping deep focus concentration blocks vs deliberate restorative active rest intervals.</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={cognitiveInsights.loading}
          className="p-2 py-2 px-4 bg-[#f5f2fb] dark:bg-white/10 text-[#5054b1] dark:text-[#bfc1ff] hover:bg-[#e1e0ff] dark:hover:bg-white/20 rounded-xl transition-all font-sans text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          {cognitiveInsights.loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Recalculate</span>
        </button>
      </div>

      {/* Static high-accuracy customized SVG chart visualization */}
      <div className={`p-6 rounded-2xl border ${
        darkCalmMode ? "bg-[#181822]/90" : "bg-white shadow-sm"
      }`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="font-sans font-bold text-xs text-[#010047] dark:text-white">Cognitive Reserve Index Mapping (Past 7 Days)</h4>
            <p className="text-[10px] text-[#72749b]">Shows the correlation of deep work hours vs systemic cognitive recovery</p>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#5054b1] font-bold bg-[#e1e0ff] dark:bg-white/10 px-2.5 py-0.5 rounded-full">
            Cognitive Capacity: {cognitiveInsights.cognitiveCapacity}%
          </span>
        </div>

        {/* Vector SVG bar chart representation */}
        <div className="relative pt-4">
          <svg viewBox="0 0 700 250" className="w-full h-auto text-gray-400">
            {/* Grid Lines */}
            <line x1="50" y1="50" x2="650" y2="50" stroke="#efecf6" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="50" y1="125" x2="650" y2="125" stroke="#efecf6" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="50" y1="200" x2="650" y2="200" stroke="#efecf6" strokeWidth="1" />

            {/* Left Axis */}
            <text x="20" y="55" className="text-[9px] font-mono fill-zinc-400">100%</text>
            <text x="20" y="130" className="text-[9px] font-mono fill-zinc-400">50%</text>
            <text x="20" y="205" className="text-[9px] font-mono fill-zinc-400">0%</text>

            {/* Render 7 Days bars */}
            {insights.map((day, idx) => {
              const xCenter = 90 + idx * 80;
              const maxBarHeight = 150;
              const deepHeight = (day.deepWorkMins / 180) * maxBarHeight;
              const restHeight = (day.activeRestMins / 90) * maxBarHeight;

              return (
                <g key={day.date}>
                  {/* Deep Work Bar */}
                  <rect 
                    x={xCenter - 15} 
                    y={200 - deepHeight} 
                    width="12" 
                    height={deepHeight} 
                    fill="#5054b1" 
                    className="transition-all hover:opacity-85"
                    rx="3"
                  />
                  {/* Active Rest Bar */}
                  <rect 
                    x={xCenter + 2} 
                    y={200 - restHeight} 
                    width="12" 
                    height={restHeight} 
                    fill="#10b981" 
                    className="transition-all hover:opacity-85"
                    rx="3"
                  />
                  {/* Day Text Label */}
                  <text x={xCenter} y="222" className="text-[10px] font-mono font-bold text-[#72749b] text-center" textAnchor="middle">
                    {day.date}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend Indicators */}
          <div className="flex items-center justify-center gap-6 mt-4 text-[10px] font-mono uppercase tracking-wider font-bold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#5054b1] rounded-sm" />
              <span>Deep Work Mins</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#10b981] rounded-sm" />
              <span>Restoration Buffers Mins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance analysis readout card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-tr from-[#5054b1] to-[#373b97] text-white space-y-2 relative min-h-[140px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-cyan-200">Dynamic Focus Diagnostic</h4>
            </div>
            {cognitiveInsights.loading ? (
              <div className="flex items-center gap-2 text-xs py-4 italic text-cyan-100">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating custom analytical diagnostic...</span>
              </div>
            ) : (
              <p className="text-xs leading-relaxed opacity-95">
                "{cognitiveInsights.focusDiagnostic}"
              </p>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-white dark:bg-[#181822] dark:border-white/10 space-y-2 text-[#464652] dark:text-zinc-300 min-h-[140px] flex flex-col justify-between">
          <div>
            <h4 className="font-sans font-bold text-xs text-[#010047] dark:text-white uppercase tracking-wider mb-2">Cortical Buffer Rest Assessment</h4>
            {cognitiveInsights.loading ? (
              <div className="flex items-center gap-2 text-xs py-4 italic text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#5054b1]" />
                <span>Assessing cognitive reserve...</span>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                "{cognitiveInsights.restAssessment}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
