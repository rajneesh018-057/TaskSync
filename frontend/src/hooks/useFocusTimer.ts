import { useState, useEffect, useRef } from "react";

export function useFocusTimer(setActiveTab: (tab: string) => void) {
  // Focus Timer States
  const [timerType, setTimerType] = useState<"deep-work" | "active-rest">("deep-work");
  const [timerState, setTimerState] = useState<"idle" | "running" | "paused" | "completed">("idle");
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(90 * 60);
  const [timerTotalDuration, setTimerTotalDuration] = useState<number>(90 * 60);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [focusStreak, setFocusStreak] = useState<number>(3);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer interval control
  useEffect(() => {
    if (timerState === "running") {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setTimerState("completed");
            setFocusStreak(streak => streak + 1);
            if (soundEnabled) {
              try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
                oscillator.connect(audioCtx.destination);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 1.5);
              } catch (_) {}
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerState, soundEnabled]);

  const handleStartFocusTimer = (type: "deep-work" | "active-rest") => {
    setTimerType(type);
    const durationMins = type === "deep-work" ? 90 : 15;
    setTimerTotalDuration(durationMins * 60);
    setTimerSecondsLeft(durationMins * 60);
    setTimerState("running");
    setActiveTab("planner"); // Navigate to planner/focus screen
  };

  return {
    timerType,
    setTimerType,
    timerState,
    setTimerState,
    timerSecondsLeft,
    setTimerSecondsLeft,
    timerTotalDuration,
    setTimerTotalDuration,
    soundEnabled,
    setSoundEnabled,
    focusStreak,
    setFocusStreak,
    handleStartFocusTimer
  };
}
