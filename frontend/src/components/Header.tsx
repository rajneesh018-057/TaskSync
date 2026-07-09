import React from "react";
import { Search, X, Bell, Plus } from "lucide-react";

interface HeaderProps {
  darkCalmMode: boolean;
  setDarkCalmMode: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  lastSyncTime: string;
  notifications: Array<{ id: string; text: string; read: boolean }>;
  setNotifications: React.Dispatch<React.SetStateAction<Array<{ id: string; text: string; read: boolean }>>>;
  setIsCaptureModalOpen: (val: boolean) => void;
  showNotificationsMenu: boolean;
  setShowNotificationsMenu: (val: boolean) => void;
}

export default function Header({
  darkCalmMode,
  setDarkCalmMode,
  searchQuery,
  setSearchQuery,
  lastSyncTime,
  notifications,
  setNotifications,
  setIsCaptureModalOpen,
  showNotificationsMenu,
  setShowNotificationsMenu
}: HeaderProps) {
  return (
    <header 
      id="top-bar"
      className={`fixed top-0 right-0 w-[calc(100%-280px)] h-16 px-8 z-20 flex justify-between items-center transition-all duration-300 border-b backdrop-blur-md ${
        darkCalmMode 
          ? "bg-[#12121a]/85 border-[#e4e1ea]/10" 
          : "bg-white/80 border-[#efecf6]"
      }`}
    >
      {/* Search Field */}
      <div className="flex items-center gap-2 max-w-sm w-full">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full w-full border transition-all duration-200 ${
          darkCalmMode 
            ? "bg-[#efecf6]/5 border-[#e4e1ea]/10 text-white" 
            : "bg-[#f5f2fb] border-[#efecf6] text-[#464652]"
        }`}>
          <Search className="w-4 h-4 text-[#72749b] shrink-0" />
          <input 
            id="search-input"
            type="text"
            placeholder="Search active tasks, goals, next actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full placeholder:text-[#72749b] dark:placeholder:text-[#c7c5d4] focus:ring-0"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-black/10 rounded-full">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Global Controls */}
      <div className="flex items-center gap-4">
        
        {/* Theme status indicator switch */}
        <button
          id="theme-toggle"
          onClick={() => setDarkCalmMode(!darkCalmMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-mono uppercase tracking-wider transition-all border ${
            darkCalmMode 
              ? "bg-gradient-to-r from-[#5054b1] to-[#373b97] text-white border-[#5054b1]/30" 
              : "bg-white text-[#5054b1] hover:bg-[#f5f2fb] border-[#efecf6]"
          }`}
          title="Toggle Active Calm Dark mode (reduces visual cortisol strain)"
        >
          <div className={`w-2.5 h-2.5 rounded-full ${darkCalmMode ? "bg-cyan-300 animate-pulse" : "bg-[#5054b1]"}`} />
          <span>{darkCalmMode ? "Active Calm Light Mode" : "Standard Mode"}</span>
        </button>

        {/* Sync status */}
        <span className="hidden md:inline text-[10px] font-mono text-[#72749b]">
          Cloud Synced: <span className="text-[#5054b1] font-semibold">{lastSyncTime}</span>
        </span>

        {/* Inbox notifications bell */}
        <div className="relative">
          <button 
            id="notifications-bell"
            onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
            className={`p-2 rounded-xl transition-all relative ${
              darkCalmMode ? "hover:bg-white/10 text-[#bfc1ff]" : "hover:bg-[#f5f2fb] text-[#72749b] hover:text-[#010047]"
            }`}
          >
            <Bell className="w-5 h-5 text-current" />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Notifications drop down visual stack */}
          {showNotificationsMenu && (
            <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border p-4 z-50 ${
              darkCalmMode ? "bg-[#181822] border-[#bfc1ff]/10 text-white" : "bg-white border-[#efecf6] text-[#1b1b21]"
            }`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-display font-bold text-xs text-[#010047] dark:text-white uppercase tracking-tight">System Alerts</h4>
                <button 
                  onClick={() => {
                    setNotifications(prev => prev.map(n => ({...n, read: true})));
                  }}
                  className="text-[10px] text-[#5054b1] hover:underline font-mono"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.map(item => (
                  <div 
                    key={item.id}
                    className={`p-2.5 rounded-lg text-xs transition-colors ${
                      item.read 
                        ? "opacity-65" 
                        : darkCalmMode ? "bg-white/5 border border-white/5" : "bg-[#f5f2fb]"
                    }`}
                  >
                    <p className="font-sans leading-relaxed text-[11px]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CAPTURE TASK button action */}
        <button 
          id="capture-task-btn"
          onClick={() => setIsCaptureModalOpen(true)}
          className="flex items-center gap-2 bg-[#5054b1] hover:bg-[#373b97] active:scale-95 text-white font-sans text-xs font-semibold px-5 py-2 rounded-full shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Capture Task</span>
        </button>

      </div>
    </header>
  );
}
