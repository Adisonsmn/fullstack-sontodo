import { create } from "zustand";
import type { PomodoroPhase, PomodoroSettings } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

interface PomodoroState {
  // Settings
  settings: PomodoroSettings;
  updateSettings: (settings: Partial<PomodoroSettings>) => Promise<void>;
  fetchSettings: (userId: string) => Promise<void>;

  // Timer state
  activeTaskId: string | null;
  phase: PomodoroPhase;
  timeRemaining: number;
  isRunning: boolean;
  sessionCount: number;
  userId: string | null;

  // Actions
  setUserId: (userId: string) => void;
  startTimer: (taskId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
  skipPhase: () => void;
  setPhase: (phase: PomodoroPhase) => void;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
};

export const usePomodoroStore = create<PomodoroState>()((set, get) => ({
  settings: DEFAULT_SETTINGS,
  activeTaskId: null,
  phase: "idle",
  timeRemaining: DEFAULT_SETTINGS.focusMinutes * 60,
  isRunning: false,
  sessionCount: 0,
  userId: null,

  setUserId: (userId) => set({ userId }),

  fetchSettings: async (userId) => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("user_settings")
      .select("pomodoro_settings")
      .eq("user_id", userId)
      .single();

    if (data?.pomodoro_settings) {
      const s = data.pomodoro_settings as PomodoroSettings;
      set({
        settings: { ...DEFAULT_SETTINGS, ...s },
        timeRemaining: (s.focusMinutes || DEFAULT_SETTINGS.focusMinutes) * 60,
      });
    }
  },

  updateSettings: async (newSettings) => {
    const { userId, settings } = get();
    const merged = { ...settings, ...newSettings };
    set({ settings: merged });

    if (userId) {
      const supabase = getSupabase();
      await supabase
        .from("user_settings")
        .update({ pomodoro_settings: merged })
        .eq("user_id", userId);
    }
  },

  startTimer: (taskId) => {
    const { settings } = get();
    set({
      activeTaskId: taskId,
      phase: "focus",
      timeRemaining: settings.focusMinutes * 60,
      isRunning: true,
    });
  },

  pauseTimer: () => set({ isRunning: false }),
  resumeTimer: () => set({ isRunning: true }),

  stopTimer: () => {
    const { settings } = get();
    set({
      activeTaskId: null,
      phase: "idle",
      timeRemaining: settings.focusMinutes * 60,
      isRunning: false,
      sessionCount: 0,
    });
  },

  tick: () => {
    const { timeRemaining, isRunning } = get();
    if (!isRunning || timeRemaining <= 0) return;
    set({ timeRemaining: timeRemaining - 1 });
  },

  skipPhase: () => {
    const { phase, sessionCount, settings } = get();

    if (phase === "focus") {
      const newSessionCount = sessionCount + 1;
      const isLongBreak =
        newSessionCount % settings.sessionsBeforeLongBreak === 0;
      set({
        phase: isLongBreak ? "long-break" : "short-break",
        timeRemaining: isLongBreak
          ? settings.longBreakMinutes * 60
          : settings.shortBreakMinutes * 60,
        isRunning: true,
        sessionCount: newSessionCount,
      });
    } else {
      set({
        phase: "focus",
        timeRemaining: settings.focusMinutes * 60,
        isRunning: true,
      });
    }
  },

  setPhase: (phase) => {
    const { settings } = get();
    let time = settings.focusMinutes * 60;
    if (phase === "short-break") time = settings.shortBreakMinutes * 60;
    if (phase === "long-break") time = settings.longBreakMinutes * 60;
    set({ phase, timeRemaining: time, isRunning: false });
  },
}));
