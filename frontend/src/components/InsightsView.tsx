import React from "react";
import { Sparkles } from "lucide-react";
import { DailyInsight } from "../types";

interface InsightsViewProps {
  darkCalmMode: boolean;
  insights: DailyInsight[];
}

export default function InsightsView({
  darkCalmMode,
  insights
}: InsightsViewProps) {
  return (
    <div className="max-w-[850px] mx-auto text-left space-y-6 pt-4">
      <div className="flex flex-col space-y-1">
        <h3 className="font-display text-2xl font-bold text-[#010047] dark:text-white">Active Calm Cognitive Telemetry</h3>
        <p className="text-sm text-[#72749b]">Observe visual indicators mapping deep focus concentration blocks vs deliberate restorative active rest intervals.</p>
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
            High alignment index
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
        <div className="p-5 rounded-2xl bg-gradient-to-tr from-[#5054b1] to-[#373b97] text-white space-y-2">
          <Sparkles className="w-6 h-6 text-cyan-300" />
          <h4 className="font-display font-medium text-xs">Dynamic Focus Diagnostic Alignment</h4>
          <p className="text-xs leading-relaxed opacity-90">
            "Your active cognitive alignment indicates optimal deep focus stamina during morning blocks of mid-week, matching steady adrenaline indicators securely."
          </p>
        </div>

        <div className="p-5 rounded-2xl border bg-white space-y-2 text-[#464652]">
          <h4 className="font-sans font-bold text-xs text-[#010047]">Cortical Buffer Rest Assessment</h4>
          <p className="text-xs leading-relaxed">
            "Buffer intervals remained steady at 35 mins. Maintaining a 1:5 ratio of active rest to deep concentration is highly recommended to eliminate executive burnouts."
          </p>
        </div>
      </div>

    </div>
  );
}
