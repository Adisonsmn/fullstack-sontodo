"use client";

import { useEffect, useRef } from "react";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useNotification } from "@/hooks/useNotification";

function playAlarmSound() {
  try {
    const ctx = new AudioContext();
    const playBeep = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Play 3 ascending beeps
    const now = ctx.currentTime;
    playBeep(523, now, 0.2);        // C5
    playBeep(659, now + 0.25, 0.2); // E5
    playBeep(784, now + 0.5, 0.4);  // G5
  } catch {
    // Audio not available
  }
}

const PHASE_LABELS: Record<string, string> = {
  focus: "Waktu Fokus Selesai!",
  "short-break": "Istirahat Pendek Selesai!",
  "long-break": "Istirahat Panjang Selesai!",
};

export default function PomodoroEngine() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { sendNotification, requestPermission, permission } = useNotification();

  const isRunning = usePomodoroStore((s) => s.isRunning);
  const timeRemaining = usePomodoroStore((s) => s.timeRemaining);
  const phase = usePomodoroStore((s) => s.phase);
  const activeTaskId = usePomodoroStore((s) => s.activeTaskId);
  const tick = usePomodoroStore((s) => s.tick);
  const skipPhase = usePomodoroStore((s) => s.skipPhase);

  const incrementPomodoro = useTaskStore((s) => s.incrementPomodoro);
  const addFocusTime = useTaskStore((s) => s.addFocusTime);
  const updateStreak = useTaskStore((s) => s.updateStreak);
  const tasks = useTaskStore((s) => s.tasks);

  // Request notification permission on mount
  useEffect(() => {
    if (permission === "default") {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, tick]);

  // Track focus time (add 1 second each tick while in focus phase)
  const prevTimeRef = useRef(timeRemaining);
  useEffect(() => {
    if (
      isRunning &&
      phase === "focus" &&
      activeTaskId &&
      prevTimeRef.current - timeRemaining === 1
    ) {
      addFocusTime(activeTaskId, 1);
    }
    prevTimeRef.current = timeRemaining;
  }, [timeRemaining, isRunning, phase, activeTaskId, addFocusTime]);

  // When timer reaches 0, handle phase completion
  useEffect(() => {
    if (timeRemaining === 0 && phase !== "idle") {
      playAlarmSound();

      // Find task title for notification
      const task = activeTaskId
        ? tasks.find((t) => t.id === activeTaskId)
        : null;
      const taskTitle = task ? task.title : "Pomodoro";
      const phaseLabel = PHASE_LABELS[phase] || "Waktu Habis!";

      // If focus phase completed, increment pomodoro count and streak
      if (phase === "focus" && activeTaskId) {
        incrementPomodoro(activeTaskId);
        updateStreak();
      }

      sendNotification(`🍅 ${phaseLabel}`, {
        body:
          phase === "focus"
            ? `Sesi fokus untuk "${taskTitle}" selesai. Saatnya istirahat!`
            : `Istirahat selesai. Ayo lanjut fokus pada "${taskTitle}"!`,
        tag: "pomodoro-timer",
      });

      // Auto-transition to next phase
      skipPhase();
    }
  }, [
    timeRemaining,
    phase,
    activeTaskId,
    tasks,
    incrementPomodoro,
    updateStreak,
    sendNotification,
    skipPhase,
  ]);

  // This component renders nothing
  return null;
}
