import React from "react";
import { 
  LayoutDashboard, 
  Inbox, 
  Calendar, 
  Target, 
  TrendingUp, 
  Settings,
  Sparkles
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName: string;
  isPro: boolean;
  tasksCount: number;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  userName, 
  isPro,
  tasksCount 
}: SidebarProps) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inbox", label: "Inbox", icon: Inbox, badge: tasksCount > 0 ? tasksCount : undefined },
    { id: "planner", label: "Planner", icon: Calendar },
    { id: "goals", label: "Goals", icon: Target },
    { id: "insights", label: "Insights", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside 
      id="sidebar-container"
      className="fixed left-0 top-0 h-full w-[280px] bg-white border-r border-[#efecf6] flex flex-col py-6 px-6 z-30 transition-all duration-300 shadow-sm"
    >
      {/* Brand Header */}
      <div className="mb-10 flex flex-col">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#5054b1] flex items-center justify-center text-white font-bold text-lg select-none">
            L
          </div>
          <h1 className="font-display text-2xl font-bold text-[#010047] tracking-tight">
            Life Saver
          </h1>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="font-sans text-xs text-[#72749b] font-medium uppercase tracking-wider">
            Active Calm Mode
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              id={`sidebar-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group text-left ${
                isActive
                  ? "bg-[#efecf6] text-[#010047] font-semibold"
                  : "text-[#72749b] hover:bg-[#f5f2fb] hover:text-[#010047]"
              }`}
            >
              <div className="flex items-center gap-3">
                <IconComponent 
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? "text-[#5054b1] scale-105" : "text-[#72749b] group-hover:scale-105"
                  }`} 
                />
                <span className="text-[13px] font-sans font-medium tracking-tight">
                  {tab.label}
                </span>
              </div>
              {tab.badge && (
                <span className="px-2 py-0.5 text-[10px] bg-[#5054b1] text-white rounded-full font-mono font-medium">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick AI status */}
      <div className="my-4 p-4 rounded-xl bg-gradient-to-tr from-[#f5f2fb] to-white border border-[#efecf6] flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-[#5054b1] shrink-0" />
        <div className="overflow-hidden">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#5054b1] font-bold">
            Equilibrium Active
          </p>
          <p className="text-[11px] text-[#72749b] truncate font-medium">
            Optimal Focus Alignment
          </p>
        </div>
      </div>

      {/* Profile Footer */}
      <div className="mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f2fb] border border-[#efecf6]">
          <div className="relative">
            <img
              className="w-10 h-10 rounded-full object-cover border border-[#c7c5d4]"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Alex Chen Profile"
              referrerPolicy="no-referrer"
            />
            {isPro && (
              <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-[#5054b1] text-white rounded-full border-2 border-white flex items-center justify-center text-[8px] font-mono font-bold select-none">
                ★
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-[13px] font-sans font-bold text-[#010047] truncate">
              {userName}
            </p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#72749b] font-bold leading-none">
              {isPro ? "Pro Account" : "Free Account"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
