import React from "react";
import { Target, Trash2 } from "lucide-react";
import { Goal } from "../types";

interface GoalsViewProps {
  darkCalmMode: boolean;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

export default function GoalsView({
  darkCalmMode,
  goals,
  setGoals
}: GoalsViewProps) {
  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  return (
    <div className="max-w-[900px] mx-auto text-left space-y-6 pt-4">
      <div className="flex flex-col space-y-1">
        <h3 className="font-display text-2xl font-bold text-[#010047] dark:text-white">Active Operational Targets</h3>
        <p className="text-sm text-[#72749b]">Sync targets to balance task prioritizations against broad critical objectives.</p>
      </div>

      {/* Goal targets alignment meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="md:col-span-3 p-8 rounded-2xl border text-center space-y-3 bg-white/5 dark:bg-white/5 border-dashed border-[#efecf6] dark:border-white/10">
            <div className="w-12 h-12 rounded-full bg-[#5054b1]/10 text-[#5054b1] flex items-center justify-center mx-auto">
              <Target className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-sm text-[#010047] dark:text-white">No active goals set yet</h4>
            <p className="text-xs text-[#72749b]">Establish your first operational objective below to align your tasks and track progress.</p>
          </div>
        ) : (
          goals.map(g => (
            <div key={g.id} className={`p-5 rounded-2xl border transition-all relative group ${
              darkCalmMode ? "bg-[#181822]/90" : "bg-white shadow-sm"
            }`}>
              <div className="flex justify-between items-start mb-3 gap-2">
                <span className="text-[10px] font-mono text-[#5054b1] bg-[#e1e0ff] dark:bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
                  {g.project}
                </span>
                <div className="flex items-center gap-2">
                  {g.targetDate && (
                    <span className="text-[10px] text-[#72749b] font-mono">{g.targetDate}</span>
                  )}
                  <button 
                    onClick={() => handleDeleteGoal(g.id)}
                    className="p-1 hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                    title="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h4 className="font-sans font-bold text-xs text-[#010047] dark:text-white leading-tight min-h-[32px]">
                {g.name}
              </h4>
              
              <div className="space-y-1.5 mt-4">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-[#72749b]">Goal Progress</span>
                  <span className="text-[#5054b1] font-bold">{g.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#efecf6] dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#5054b1] rounded-full" style={{ width: `${g.progress}%` }} />
                </div>
              </div>

              {g.metric && (
                <p className="text-[10px] font-mono text-[#72749b] uppercase tracking-wider mt-3 font-medium bg-[#f5f2fb]/50 dark:bg-black/20 p-2 rounded-lg">
                  Key Result: {g.metric}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Custom Goal Target Section */}
      <div className={`p-6 rounded-2xl border ${
        darkCalmMode ? "bg-[#181822]/40" : "bg-white"
      }`}>
        <h4 className="font-display font-bold text-sm text-[#010047] dark:text-white mb-4">Establish New Operational Objective</h4>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const target = e.currentTarget;
            const name = (target.elements.namedItem("gName") as HTMLInputElement).value;
            const project = (target.elements.namedItem("gProj") as HTMLInputElement).value;
            const metric = (target.elements.namedItem("gMetric") as HTMLInputElement).value;
            const date = (target.elements.namedItem("gDate") as HTMLInputElement).value;
            
            if (!name.trim()) return;

            const newGoal: Goal = {
              id: `goal-${Date.now()}`,
              name,
              project: project || "General",
              progress: 0,
              targetDate: date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              metric: metric || "Milestone progress complete"
            };
            setGoals(prev => [...prev, newGoal]);
            target.reset();
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans"
        >
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] text-zinc-500 font-mono">Objective Statement</label>
            <input required name="gName" type="text" placeholder="e.g. Launch Product Redesign" className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6] dark:border-white/10 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-mono">Goal Area Group</label>
            <input name="gProj" type="text" placeholder="e.g. Product" className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6] dark:border-white/10 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-mono">Metric Tracking Indicator</label>
            <input name="gMetric" type="text" placeholder="e.g. Complete 5 key milestones" className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6] dark:border-white/10 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-mono">Target Deadline Date</label>
            <input name="gDate" type="date" className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6] dark:border-white/10 dark:text-white" />
          </div>
          
          <div className="md:col-span-4 text-right pt-2">
            <button type="submit" className="bg-[#5054b1] hover:bg-[#373b97] text-white text-xs font-semibold px-6 py-2 rounded-xl transition-all cursor-pointer">
              Register Goal Area
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
