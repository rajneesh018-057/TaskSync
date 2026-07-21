import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Sidebar from "./components/Sidebar";
import AIAssistantDrawer from "./components/AIAssistantDrawer";
import DashboardView from "./components/DashboardView";
import InboxView from "./components/InboxView";
import PlannerView from "./components/PlannerView";
import GoalsView from "./components/GoalsView";
import InsightsView from "./components/InsightsView";
import SettingsView from "./components/SettingsView";
import CaptureModal from "./components/CaptureModal";
import AuthView from "./components/AuthView";
import Header from "./components/Header";

// Custom hooks
import { useAuth } from "./hooks/useAuth";
import { useAppData } from "./hooks/useAppData";
import { useFocusTimer } from "./hooks/useFocusTimer";
import { useAiTelemetry } from "./hooks/useAiTelemetry";

import { calculateRiskLevel } from "./utils";

export default function App() {
  // Navigation & Core UI state
  const [darkCalmMode, setDarkCalmMode] = useState<boolean>(() => {
    return localStorage.getItem("lifesaver_dark_calm") === "true";
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; read: boolean }>>([
    { id: "noti-1", text: "Predictive Schedule Alignment suggestions are ready for your tasks.", read: false },
    { id: "noti-2", text: "Attention: 2 Deep Work block configurations were automatically consolidated.", read: true },
  ]);

  // Hook 1: Authentication management
  const {
    token,
    user,
    userName,
    userEmail,
    profilePic,
    handleAuthSuccess,
    handleLogout,
    handleUpdateProfile
  } = useAuth();

  // Hook 2: App state and data sync (Tasks, Goals, Schedule, Calendars)
  const {
    activeTab,
    setActiveTab,
    lastSyncTime,
    tasks,
    deletedTasks,
    historyTab,
    setHistoryTab,
    goals,
    setGoals,
    schedule,
    setSchedule,
    isCalendarConnected,
    setIsCalendarConnected,
    connectedSources,
    setConnectedSources,
    plannerView,
    setPlannerView,
    appliedOptimizations,
    setAppliedOptimizations,
    showConnectionMenu,
    setShowConnectionMenu,
    isConnecting,
    setIsConnecting,
    googleEvents,
    inboxText,
    setInboxText,
    triageLoading,
    triageFeedback,
    parserRunning,
    parsedPreview,
    newTaskTitle,
    setNewTaskTitle,
    newTaskGoalProject,
    setNewTaskGoalProject,
    customDuration,
    setCustomDuration,
    rawDumpInput,
    setRawDumpInput,
    expandedTaskId,
    setExpandedTaskId,
    handleAddNewTask,
    handleDirectAdd,
    handleToggleTask,
    handleToggleScheduleItem,
    handleDeleteTask,
    handleRestoreDeletedTask,
    handlePermanentDeleteTask,
    handleClearAllDeletedTasks,
    handleParseRawText,
    handleResetAllData
  } = useAppData({ token });

  // Hook 3: Focus cycle pacing timer
  const {
    timerType,
    timerState,
    timerSecondsLeft,
    timerTotalDuration,
    soundEnabled,
    setSoundEnabled,
    focusStreak,
    handleStartFocusTimer
  } = useFocusTimer(setActiveTab);

  // Hook 4: AI advisor analysis and cognitive load telemetry
  const {
    aiAdvice,
    fetchAiAdvice,
    cognitiveInsights,
    fetchCognitiveInsights,
    getDynamicInsights
  } = useAiTelemetry({ token, tasks, goals, schedule });

  // Toggle .dark class in html document root for standard vs calm themes
  useEffect(() => {
    localStorage.setItem("lifesaver_dark_calm", String(darkCalmMode));
    if (darkCalmMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkCalmMode]);

  // Combined logout that also clears application data states
  const handleAppLogout = () => {
    handleLogout();
    handleResetAllData();
  };

  // Derived state selections
  const activeUncompletedTasks = tasks.filter(t => !t.completed);
  const activeUncompletedCount = activeUncompletedTasks.length;
  const currentRisk = calculateRiskLevel(tasks);

  const filteredTasks = tasks.filter(task => {
    const matchQuery = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.nextStep && task.nextStep.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchQuery;
  });

  if (!token) {
    return <AuthView onAuthSuccess={handleAuthSuccess} darkCalmMode={darkCalmMode} />;
  }

  return (
    <div className={`min-h-screen font-sans antialiased text-[#1b1b21] transition-colors duration-300 ${
      darkCalmMode ? "bg-[#12121a] text-white" : "bg-[#fbf8ff] text-[#1b1b21]"
    }`}>
      
      {/* Sidebar - Fixed Left Rail */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setShowNotificationsMenu(false);
        }}
        userName={userName}
        tasksCount={activeUncompletedCount}
        onLogout={handleAppLogout}
        profilePic={profilePic}
      />

      {/* Top Navigation Bar / Search / Notifications */}
      <Header
        darkCalmMode={darkCalmMode}
        setDarkCalmMode={setDarkCalmMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        lastSyncTime={lastSyncTime}
        notifications={notifications}
        setNotifications={setNotifications}
        setIsCaptureModalOpen={setIsCaptureModalOpen}
        showNotificationsMenu={showNotificationsMenu}
        setShowNotificationsMenu={setShowNotificationsMenu}
      />

      {/* Main Container Workspace */}
      <main className="ml-[280px] pt-16 min-h-screen px-8 pb-16">
        
        {/* Dynamic global risk feedback banner if tasks grow heavy */}
        {activeUncompletedCount >= 5 && (
          <div className="mt-4 p-4 rounded-xl border border-rose-200/20 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
              <div>
                <p className="font-semibold text-xs">Extreme cognitive load warning</p>
                <p className="text-[11px] leading-tight">
                  You have {activeUncompletedCount} active priorities today. Consider starting deep work triage blocks to offload tasks.
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleStartFocusTimer("deep-work")}
              className="text-xs bg-rose-700 hover:bg-rose-800 text-white font-semibold px-3 py-1.5 rounded-lg transition-all"
            >
              Start Deep Focus Loop
            </button>
          </div>
        )}

        {/* 1. DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <DashboardView
            darkCalmMode={darkCalmMode}
            aiAdvice={aiAdvice}
            fetchAiAdvice={fetchAiAdvice}
            tasks={tasks}
            filteredTasks={filteredTasks}
            expandedTaskId={expandedTaskId}
            setExpandedTaskId={setExpandedTaskId}
            handleToggleTask={handleToggleTask}
            handleDeleteTask={handleDeleteTask}
            handleRestoreDeletedTask={handleRestoreDeletedTask}
            handlePermanentDeleteTask={handlePermanentDeleteTask}
            handleDirectAdd={handleDirectAdd}
            setIsCaptureModalOpen={setIsCaptureModalOpen}
            schedule={schedule}
            handleToggleScheduleItem={handleToggleScheduleItem}
            deletedTasks={deletedTasks}
            historyTab={historyTab}
            setHistoryTab={setHistoryTab}
            currentRisk={currentRisk}
            userName={userName}
            onClearAllDeletedTasks={handleClearAllDeletedTasks}
          />
        )}

        {/* 2. INBOX TRIAGE VIEW */}
        {activeTab === "inbox" && (
          <InboxView
            darkCalmMode={darkCalmMode}
            inboxText={inboxText}
            setInboxText={setInboxText}
            triageLoading={triageLoading}
            triageFeedback={triageFeedback || ""}
            tasks={tasks}
            handleParseRawText={handleParseRawText}
          />
        )}

        {/* 3. FOCUS TIMER & PLANNER VIEW */}
        {activeTab === "planner" && (
          <PlannerView
            darkCalmMode={darkCalmMode}
            plannerView={plannerView}
            setPlannerView={setPlannerView}
            isCalendarConnected={isCalendarConnected}
            setIsCalendarConnected={setIsCalendarConnected}
            connectedSources={connectedSources}
            setConnectedSources={setConnectedSources}
            appliedOptimizations={appliedOptimizations}
            setAppliedOptimizations={setAppliedOptimizations}
            showConnectionMenu={showConnectionMenu}
            setShowConnectionMenu={setShowConnectionMenu}
            isConnecting={isConnecting}
            setIsConnecting={setIsConnecting}
            googleEvents={googleEvents}
            userId={user?.id}
          />
        )}

        {/* 4. GOALS VIEW */}
        {activeTab === "goals" && (
          <GoalsView
            darkCalmMode={darkCalmMode}
            goals={goals}
            setGoals={setGoals}
          />
        )}

        {/* 5. ANALYTICS INSIGHTS VIEW */}
        {activeTab === "insights" && (
          <InsightsView
            darkCalmMode={darkCalmMode}
            insights={getDynamicInsights()}
            cognitiveInsights={cognitiveInsights}
            onRefresh={fetchCognitiveInsights}
          />
        )}

        {/* 6. SETTINGS VIEW */}
        {activeTab === "settings" && (
          <SettingsView
            darkCalmMode={darkCalmMode}
            userName={userName}
            userEmail={userEmail}
            profilePic={profilePic}
            onLogout={handleAppLogout}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

      </main>

      {/* Structured Capture Task Modal overlay */}
      <CaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        darkCalmMode={darkCalmMode}
        rawDumpInput={rawDumpInput}
        setRawDumpInput={setRawDumpInput}
        newTaskTitle={newTaskTitle}
        setNewTaskTitle={setNewTaskTitle}
        newTaskGoalProject={newTaskGoalProject}
        setNewTaskGoalProject={setNewTaskGoalProject}
        customDuration={customDuration}
        setCustomDuration={setCustomDuration}
        parserRunning={parserRunning}
        parsedPreview={parsedPreview}
        handleParseRawText={handleParseRawText}
        handleAddNewTask={handleAddNewTask}
      />

      {/* Floating AI Cognitive assistant drawer panel */}
      <AIAssistantDrawer 
        tasks={tasks}
        schedule={schedule}
        setSchedule={setSchedule}
        isDark={darkCalmMode}
        onOpenCaptureModal={() => setIsCaptureModalOpen(true)}
        token={token}
        aiAdvice={aiAdvice}
      />

    </div>
  );
}
