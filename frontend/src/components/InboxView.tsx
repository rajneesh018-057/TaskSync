import React from "react";
import { Sparkles, CheckCircle } from "lucide-react";
import { Task } from "../types";

interface InboxViewProps {
  darkCalmMode: boolean;
  inboxText: string;
  setInboxText: (text: string) => void;
  triageLoading: boolean;
  triageFeedback: string;
  tasks: Task[];
  handleParseRawText: (text: string, fromTriage: boolean) => Promise<void>;
}

export default function InboxView({
  darkCalmMode,
  inboxText,
  setInboxText,
  triageLoading,
  triageFeedback,
  tasks,
  handleParseRawText
}: InboxViewProps) {
  return (
    <div className="max-w-[800px] mx-auto text-left space-y-6 pt-4">
      <div className="flex flex-col space-y-1">
        <h3 className="font-display text-2xl font-bold text-[#010047] dark:text-white">Brain-Dump Triage Studio</h3>
        <p className="text-sm text-[#72749b]">
          Dump unstructured thoughts, unformatted bullet strings, or transcripts. We configure precise scores, project alignment, duration bounds, and sequence them instantly.
        </p>
      </div>

      <div className={`glass-panel p-6 rounded-2xl border ${darkCalmMode ? "bg-[#181822]/60" : "bg-white"}`}>
        <label className="block text-xs font-mono uppercase tracking-widest text-[#5054b1] mb-2 font-bold">Unformatted Brain-Dump Dumpster</label>
        <textarea 
          className={`w-full h-44 rounded-xl p-4 text-xs font-sans border focus:outline-none focus:ring-2 focus:ring-[#5054b1] resize-none ${
            darkCalmMode ? "bg-white/5 border-white/10 text-white" : "bg-[#fbf8ff] border-[#efecf6] text-[#010047]"
          }`}
          placeholder="e.g. need to finish analyzing the design parameters today, probably takes about an hour under management essentials project..."
          value={inboxText}
          onChange={(e) => setInboxText(e.target.value)}
        />
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-[10px] text-[#72749b] font-mono">
            Characters typed: <span className="text-[#5054b1] font-semibold">{inboxText.length}</span>
          </span>
          
          <button
            onClick={() => handleParseRawText(inboxText, true)}
            disabled={triageLoading || !inboxText.trim()}
            className="flex items-center gap-2 bg-[#5054b1] hover:bg-[#373b97] disabled:bg-gray-400 text-white text-xs font-bold font-sans py-2 px-5 rounded-xl transition-all shadow"
          >
            {triageLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-current" />
                <span>Gemini prioritizing task...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>Parse Priorities & Save</span>
              </>
            )}
          </button>
        </div>

        {triageFeedback && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2 text-xs">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-medium">{triageFeedback}</p>
          </div>
        )}
      </div>

      {/* Quick Inbox List stats */}
      <div className="space-y-3">
        <h4 className="font-display text-sm font-bold text-[#010047] dark:text-white">Processed Tasks Stream ({tasks.length})</h4>
        <div className="space-y-2">
          {tasks.map(t => (
            <div key={t.id} className="p-3.5 rounded-xl bg-white/40 dark:bg-white/5 border border-[#efecf6] dark:border-white/5 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-[#010047] dark:text-white">{t.title}</p>
                <p className="text-[10px] text-[#72749b] mt-0.5">Project: {t.project} &bull; Score: {t.score} &bull; Load: {t.cognitiveLoad}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#efecf6] dark:bg-white/10 font-mono text-[9px] text-[#72749b]">{t.duration}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
