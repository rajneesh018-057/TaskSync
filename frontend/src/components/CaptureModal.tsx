import React from "react";
import { X, Sparkles, RefreshCw, ArrowRight, Check } from "lucide-react";

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkCalmMode: boolean;
  rawDumpInput: string;
  setRawDumpInput: (val: string) => void;
  newTaskTitle: string;
  setNewTaskTitle: (val: string) => void;
  newTaskGoalProject: string;
  setNewTaskGoalProject: (val: string) => void;
  customDuration: string;
  setCustomDuration: (val: string) => void;
  parserRunning: boolean;
  parsedPreview: any;
  handleParseRawText: (text: string) => Promise<void>;
  handleAddNewTask: () => void;
}

export default function CaptureModal({
  isOpen,
  onClose,
  darkCalmMode,
  rawDumpInput,
  setRawDumpInput,
  newTaskTitle,
  setNewTaskTitle,
  newTaskGoalProject,
  setNewTaskGoalProject,
  customDuration,
  setCustomDuration,
  parserRunning,
  parsedPreview,
  handleParseRawText,
  handleAddNewTask
}: CaptureModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#010047]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#181822] rounded-2xl w-full max-w-[600px] border border-[#efecf6] dark:border-white/10 shadow-2xl p-6 text-left relative transition-all animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-[#efecf6] dark:hover:bg-white/10 rounded-full transition-all text-[#72749b]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#5054b1] animate-bounce" />
          <h3 className="font-display text-lg font-bold text-[#010047] dark:text-white">AI-Scored Task Capturing</h3>
        </div>

        {/* AI Parsing raw input box */}
        <div className="p-4 rounded-xl bg-gradient-to-tr from-[#f5f2fb] to-white dark:from-[#1c1c2b] dark:to-[#181822] border border-[#efecf6] dark:border-white/5 space-y-2 mb-4">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[#5054b1] dark:text-cyan-400 font-bold">Unstructured Sentence priorities parsing</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. need to write a performance summary for UX Audit before Friday afternoon..."
              value={rawDumpInput}
              onChange={(e) => setRawDumpInput(e.target.value)}
              className="w-full text-xs font-sans px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5054b1] bg-white dark:bg-[#101018] dark:border-white/10 text-[#010047] dark:text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleParseRawText(rawDumpInput);
                }
              }}
            />
            <button 
              type="button" 
              onClick={() => handleParseRawText(rawDumpInput)}
              className="bg-[#5054b1] hover:bg-[#373b97] text-white p-2 px-4 rounded-lg font-sans text-xs font-semibold flex items-center gap-1 shrink-0"
            >
              {parserRunning ? (
                <RefreshCw className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <span>Analyze Sentence</span>
              )}
            </button>
          </div>
        </div>

        {/* Manual adjustment attributes inputs */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider">Actionable Task Title</label>
            <input 
              type="text" 
              placeholder="Action Item Goal" 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full p-2.5 border rounded-lg bg-transparent text-xs text-[#010047] dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider">Goal / Project Bounds</label>
              <select 
                value={newTaskGoalProject}
                onChange={(e) => setNewTaskGoalProject(e.target.value)}
                className="w-full p-2.5 border rounded-lg bg-transparent text-xs text-[#010047] dark:text-white dark:bg-[#181822]"
              >
                <option className="text-black" value="General">General Context</option>
                <option className="text-black" value="Management Essentials">Management Essentials</option>
                <option className="text-black" value="UX Audit">UX Audit</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider">Estimated Pacing Duration</label>
              <input 
                type="text" 
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="e.g. 45m, 1h, 2h"
                className="w-full p-2.5 border rounded-lg bg-transparent text-xs text-[#010047] dark:text-white"
              />
            </div>
          </div>

          {/* Live Preview priority dynamic score output feedback */}
          {parsedPreview && (
            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 text-emerald-950 text-xs flex justify-between items-center animate-in fade-in-50 duration-200">
              <div>
                <span className="block font-bold text-emerald-900">Computed Priority: Score {parsedPreview.score}</span>
                <span className="text-[10px] text-zinc-600 block mt-0.5">Diagnosed Overload class: {parsedPreview.cognitiveLoad}</span>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-700 text-white font-mono rounded-full text-[9px] uppercase tracking-wider font-bold">Awesome match</span>
            </div>
          )}

          {/* Submit triggers action container */}
          <div className="pt-4 border-t border-[#efecf6] dark:border-white/5 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-[#efecf6] text-[#72749b] text-xs hover:bg-[#efecf6] transition-all font-semibold font-sans bg-transparent"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddNewTask}
              disabled={!newTaskTitle.trim()}
              className="px-6 py-2 rounded-xl bg-[#5054b1] hover:bg-[#373b97] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs transition-all font-semibold font-sans"
            >
              Register Scheduled Priority
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
