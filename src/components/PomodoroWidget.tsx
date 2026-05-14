"use client";

import {
  Play,
  Pause,
  Square,
  SkipForward,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { useTaskStore } from "@/store/useTaskStore";
import { cn } from "@/lib/utils";
import { useState } from "react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const PHASE_CONFIG = {
  focus: { label: "Fokus", color: "var(--brand-red)", bgClass: "bg-brand-red" },
  "short-break": {
    label: "Istirahat Pendek",
    color: "var(--color-done)",
    bgClass: "bg-[var(--color-done)]",
  },
  "long-break": {
    label: "Istirahat Panjang",
    color: "var(--color-career)",
    bgClass: "bg-[var(--color-career)]",
  },
  idle: { label: "Idle", color: "var(--foreground-muted)", bgClass: "bg-foreground-muted" },
};

export default function PomodoroWidget() {
  const [minimized, setMinimized] = useState(false);

  const activeTaskId = usePomodoroStore((s) => s.activeTaskId);
  const phase = usePomodoroStore((s) => s.phase);
  const timeRemaining = usePomodoroStore((s) => s.timeRemaining);
  const isRunning = usePomodoroStore((s) => s.isRunning);
  const sessionCount = usePomodoroStore((s) => s.sessionCount);
  const settings = usePomodoroStore((s) => s.settings);
  const pauseTimer = usePomodoroStore((s) => s.pauseTimer);
  const resumeTimer = usePomodoroStore((s) => s.resumeTimer);
  const stopTimer = usePomodoroStore((s) => s.stopTimer);
  const skipPhase = usePomodoroStore((s) => s.skipPhase);

  const tasks = useTaskStore((s) => s.tasks);

  // Don't show if no active session
  if (!activeTaskId || phase === "idle") return null;

  const task = tasks.find((t) => t.id === activeTaskId);
  const phaseConfig = PHASE_CONFIG[phase];

  // Calculate progress for the circular ring
  let totalPhaseTime = settings.focusMinutes * 60;
  if (phase === "short-break") totalPhaseTime = settings.shortBreakMinutes * 60;
  if (phase === "long-break") totalPhaseTime = settings.longBreakMinutes * 60;

  const progress = totalPhaseTime > 0 ? 1 - timeRemaining / totalPhaseTime : 0;
  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      {minimized ? (
        /* ---- Minimized pill ---- */
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-background-secondary shadow-lg hover:shadow-xl transition-all cursor-pointer"
        >
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full shrink-0",
              isRunning && "animate-pulse"
            )}
            style={{ backgroundColor: phaseConfig.color }}
          />
          <span className="text-sm font-mono font-semibold text-foreground">
            {formatTime(timeRemaining)}
          </span>
          <ChevronUp className="w-4 h-4 text-foreground-muted" />
        </button>
      ) : (
        /* ---- Expanded widget ---- */
        <div className="w-72 rounded-2xl border border-border bg-background-secondary shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  isRunning && "animate-pulse"
                )}
                style={{ backgroundColor: phaseConfig.color }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: phaseConfig.color }}
              >
                {phaseConfig.label}
              </span>
            </div>
            <button
              onClick={() => setMinimized(true)}
              className="p-1 rounded hover:bg-background-tertiary transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4 text-foreground-muted" />
            </button>
          </div>

          {/* Timer display */}
          <div className="flex flex-col items-center py-6">
            {/* SVG circular progress */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="6"
                />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke={phaseConfig.color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                />
              </svg>
              {/* Time text in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-mono font-bold text-foreground">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>

            {/* Task name */}
            {task && (
              <p className="mt-3 text-sm text-foreground-muted text-center px-4 truncate max-w-full">
                {task.title}
              </p>
            )}

            {/* Session count */}
            <p className="mt-1 text-xs text-foreground-subtle">
              Sesi ke-{sessionCount + (phase === "focus" ? 1 : 0)} dari{" "}
              {task ? task.pomodoroEstimate : "∞"}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 px-4 pb-5">
            {/* Stop */}
            <button
              onClick={stopTimer}
              className="p-2.5 rounded-xl border border-border hover:bg-background-tertiary transition-colors cursor-pointer"
              title="Berhenti"
            >
              <Square className="w-5 h-5 text-foreground-muted" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={isRunning ? pauseTimer : resumeTimer}
              className="p-3.5 rounded-xl text-white transition-colors cursor-pointer"
              style={{ backgroundColor: phaseConfig.color }}
              title={isRunning ? "Pause" : "Lanjutkan"}
            >
              {isRunning ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            {/* Skip */}
            <button
              onClick={skipPhase}
              className="p-2.5 rounded-xl border border-border hover:bg-background-tertiary transition-colors cursor-pointer"
              title="Lewati fase"
            >
              <SkipForward className="w-5 h-5 text-foreground-muted" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
