// =============================================
// Task Types
// =============================================

export type TaskCategory = "kuis" | "tugas" | "learn-competition" | "career-learn";

export type TaskPriority = "high" | "medium" | "low";

export type TaskStatus = "todo" | "in-progress" | "done";

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  subtasks: SubTask[];
  notes: string;
  deadline: string | null; // ISO date string
  createdAt: string;
  updatedAt: string;

  // Pomodoro
  pomodoroEstimate: number; // estimated number of sessions
  pomodoroCompleted: number; // actual completed sessions
  pomodoroMinutes: number; // minutes per session (default 25)
  totalFocusTime: number; // total seconds spent focusing

  // Google Calendar
  calendarEventId: string | null;

  // Notifications
  reminderSent?: boolean;
}

// =============================================
// Pomodoro Types
// =============================================

export type PomodoroPhase = "focus" | "short-break" | "long-break" | "idle";

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

// =============================================
// Category & Priority Metadata
// =============================================

export const CATEGORY_CONFIG: Record<
  TaskCategory,
  { label: string; emoji: string; color: string; deadlineReminderDays: number }
> = {
  kuis: {
    label: "Kuis",
    emoji: "📝",
    color: "var(--color-kuis)",
    deadlineReminderDays: 1,
  },
  tugas: {
    label: "Tugas",
    emoji: "📚",
    color: "var(--color-tugas)",
    deadlineReminderDays: 3,
  },
  "learn-competition": {
    label: "Learn Competition",
    emoji: "🏆",
    color: "var(--color-competition)",
    deadlineReminderDays: 7,
  },
  "career-learn": {
    label: "Career Learn",
    emoji: "💼",
    color: "var(--color-career)",
    deadlineReminderDays: 3,
  },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; icon: string }
> = {
  high: { label: "Tinggi", color: "var(--color-high)", icon: "🔴" },
  medium: { label: "Sedang", color: "var(--color-medium)", icon: "🟡" },
  low: { label: "Rendah", color: "var(--color-low)", icon: "🟢" },
};

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string }
> = {
  todo: { label: "To Do", color: "var(--color-todo)" },
  "in-progress": { label: "In Progress", color: "var(--color-progress)" },
  done: { label: "Done", color: "var(--color-done)" },
};
