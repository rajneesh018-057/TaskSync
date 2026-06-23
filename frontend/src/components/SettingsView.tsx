import React from "react";
import { Award } from "lucide-react";

interface SettingsViewProps {
  darkCalmMode: boolean;
  userName: string;
  setUserName: (name: string) => void;
  isPro: boolean;
}

export default function SettingsView({
  darkCalmMode,
  userName,
  setUserName,
  isPro
}: SettingsViewProps) {
  return (
    <div className="max-w-[700px] mx-auto text-left space-y-6 pt-4">
      <div className="flex flex-col space-y-1">
        <h3 className="font-display text-2xl font-bold text-[#010047] dark:text-white">App Settings & Customization</h3>
        <p className="text-sm text-[#72749b]">Configure profile options, default task durations, or change client settings.</p>
      </div>

      <div className={`p-6 rounded-2xl border space-y-6 ${
        darkCalmMode ? "bg-[#181822]/90 text-white" : "bg-white"
      }`}>
        
        {/* User settings parameters */}
        <div className="space-y-4">
          <h4 className="font-sans font-bold text-xs text-[#010047] dark:text-white uppercase tracking-wider">User Identity</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider block">Profile Username</label>
              <input 
                type="text" 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)} 
                className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6] dark:border-white/10 dark:text-white"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider block">Account Type Status</label>
              <div className="flex items-center justify-between p-2.5 border rounded-lg border-[#efecf6] dark:border-white/10 bg-[#f5f2fb]/50 dark:bg-black/20">
                <span className="font-bold text-[#5054b1] dark:text-[#bfc1ff]">
                  {isPro ? "Executive Pro Account" : "Standard Account"}
                </span>
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Focus parameters defaults */}
        <div className="space-y-4 pt-6 border-t border-[#efecf6] dark:border-white/5">
          <h4 className="font-sans font-bold text-xs text-[#010047] dark:text-white uppercase tracking-wider">Focus Custom Parameters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider block">Default Work Cycle Length</label>
              <select className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6] dark:border-white/10 dark:bg-[#181822] dark:text-white">
                <option className="text-black" value="45">45 Minutes</option>
                <option className="text-black" value="60">60 Minutes</option>
                <option className="text-black" value="90">90 Minutes (Recommended)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider block">Default Break Rest Length</label>
              <select className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6] dark:border-white/10 dark:bg-[#181822] dark:text-white">
                <option className="text-black" value="10">10 Minutes</option>
                <option className="text-black" value="15">15 Minutes (Recommended)</option>
                <option className="text-black" value="25">25 Minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Developer / reset control bounds */}
        <div className="space-y-4 pt-6 border-t border-rose-100 dark:border-rose-950/30">
          <h4 className="font-sans font-bold text-xs text-rose-500 uppercase tracking-wider">Experimental Recovery Actions</h4>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-[#72749b]">Reset cached local tasks metadata to return to default initial mockups.</p>
            <button 
              onClick={() => {
                if (confirm("Reset current cached priority lists back to mock state?")) {
                  localStorage.removeItem("lifesaver_tasks");
                  localStorage.removeItem("lifesaver_goals");
                  localStorage.removeItem("lifesaver_schedule");
                  localStorage.removeItem("lifesaver_deleted_tasks");
                  window.location.reload();
                }
              }}
              className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs px-5 py-2 rounded-xl transition-all font-semibold font-sans dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400"
            >
              Reset System Data
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
