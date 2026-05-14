import { create } from "zustand";
import type { Task, TaskCategory, TaskPriority, TaskStatus, SubTask } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

// =============================================
// DB ↔ TypeScript mapping helpers
// =============================================

interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  subtasks: SubTask[];
  notes: string;
  deadline: string | null;
  pomodoro_estimate: number;
  pomodoro_completed: number;
  pomodoro_minutes: number;
  total_focus_time: number;
  calendar_event_id: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    category: row.category as TaskCategory,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    subtasks: row.subtasks || [],
    notes: row.notes || "",
    deadline: row.deadline,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pomodoroEstimate: row.pomodoro_estimate,
    pomodoroCompleted: row.pomodoro_completed,
    pomodoroMinutes: row.pomodoro_minutes,
    totalFocusTime: row.total_focus_time,
    calendarEventId: row.calendar_event_id,
    reminderSent: row.reminder_sent,
  };
}

function taskToRow(task: Partial<Task>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (task.title !== undefined) row.title = task.title;
  if (task.description !== undefined) row.description = task.description;
  if (task.category !== undefined) row.category = task.category;
  if (task.priority !== undefined) row.priority = task.priority;
  if (task.status !== undefined) row.status = task.status;
  if (task.subtasks !== undefined) row.subtasks = task.subtasks;
  if (task.notes !== undefined) row.notes = task.notes;
  if (task.deadline !== undefined) row.deadline = task.deadline;
  if (task.pomodoroEstimate !== undefined) row.pomodoro_estimate = task.pomodoroEstimate;
  if (task.pomodoroCompleted !== undefined) row.pomodoro_completed = task.pomodoroCompleted;
  if (task.pomodoroMinutes !== undefined) row.pomodoro_minutes = task.pomodoroMinutes;
  if (task.totalFocusTime !== undefined) row.total_focus_time = task.totalFocusTime;
  if (task.calendarEventId !== undefined) row.calendar_event_id = task.calendarEventId;
  if (task.reminderSent !== undefined) row.reminder_sent = task.reminderSent;
  row.updated_at = new Date().toISOString();
  return row;
}

// =============================================
// Store Interface
// =============================================

interface TaskState {
  tasks: Task[];
  loading: boolean;
  userId: string | null;

  // Init
  setUserId: (userId: string) => void;
  fetchTasks: () => Promise<void>;

  // CRUD
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "pomodoroCompleted" | "totalFocusTime" | "calendarEventId">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Sub-tasks
  addSubTask: (taskId: string, title: string) => Promise<void>;
  toggleSubTask: (taskId: string, subTaskId: string) => Promise<void>;
  deleteSubTask: (taskId: string, subTaskId: string) => Promise<void>;

  // Filters
  filterByCategory: (category: TaskCategory | "all") => Task[];
  filterByPriority: (priority: TaskPriority | "all") => Task[];
  filterByStatus: (status: TaskStatus | "all") => Task[];
  getTodayTasks: () => Task[];

  // Pomodoro tracking
  incrementPomodoro: (taskId: string) => Promise<void>;
  addFocusTime: (taskId: string, seconds: number) => void;

  // Streak
  streak: number;
  lastActiveDate: string | null;
  updateStreak: () => Promise<void>;
  fetchUserSettings: () => Promise<void>;
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  loading: false,
  userId: null,
  streak: 0,
  lastActiveDate: null,

  setUserId: (userId) => set({ userId }),

  fetchTasks: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ loading: true });
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      set({ tasks: (data as TaskRow[]).map(rowToTask) });
    }
    set({ loading: false });
  },

  fetchUserSettings: async () => {
    const { userId } = get();
    if (!userId) return;
    const supabase = getSupabase();
    const { data } = await supabase
      .from("user_settings")
      .select("streak, last_active_date")
      .eq("user_id", userId)
      .single();

    if (data) {
      set({
        streak: data.streak || 0,
        lastActiveDate: data.last_active_date || null,
      });
    }
  },

  // ---- CRUD ----
  addTask: async (taskData) => {
    const { userId } = get();
    if (!userId) return;
    const supabase = getSupabase();

    const insertData = {
      user_id: userId,
      title: taskData.title,
      description: taskData.description,
      category: taskData.category,
      priority: taskData.priority,
      status: taskData.status,
      subtasks: taskData.subtasks,
      notes: taskData.notes,
      deadline: taskData.deadline,
      pomodoro_estimate: taskData.pomodoroEstimate,
      pomodoro_minutes: taskData.pomodoroMinutes,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(insertData)
      .select()
      .single();

    if (!error && data) {
      const newTask = rowToTask(data as TaskRow);
      set((state) => ({ tasks: [newTask, ...state.tasks] }));
    } else {
      console.error("Error adding task:", error);
    }
  },

  updateTask: async (id, updates) => {
    const supabase = getSupabase();
    const row = taskToRow(updates);

    const { error } = await supabase
      .from("tasks")
      .update(row)
      .eq("id", id);

    if (!error) {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id
            ? { ...t, ...updates, updatedAt: new Date().toISOString() }
            : t
        ),
      }));
    }
  },

  deleteTask: async (id) => {
    const supabase = getSupabase();
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) {
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    }
  },

  // ---- Sub-tasks ----
  addSubTask: async (taskId, title) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newSubtasks = [
      ...task.subtasks,
      { id: crypto.randomUUID(), title, completed: false },
    ];
    await get().updateTask(taskId, { subtasks: newSubtasks });
  },

  toggleSubTask: async (taskId, subTaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newSubtasks = task.subtasks.map((st) =>
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    await get().updateTask(taskId, { subtasks: newSubtasks });
  },

  deleteSubTask: async (taskId, subTaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newSubtasks = task.subtasks.filter((st) => st.id !== subTaskId);
    await get().updateTask(taskId, { subtasks: newSubtasks });
  },

  // ---- Filters ----
  filterByCategory: (category) => {
    const { tasks } = get();
    if (category === "all") return tasks;
    return tasks.filter((t) => t.category === category);
  },

  filterByPriority: (priority) => {
    const { tasks } = get();
    if (priority === "all") return tasks;
    return tasks.filter((t) => t.priority === priority);
  },

  filterByStatus: (status) => {
    const { tasks } = get();
    if (status === "all") return tasks;
    return tasks.filter((t) => t.status === status);
  },

  getTodayTasks: () => {
    const { tasks } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter((t) => {
      if (t.status === "done") return false;
      if (!t.deadline) return t.priority === "high";
      const deadline = new Date(t.deadline);
      return deadline <= tomorrow;
    });
  },

  // ---- Pomodoro ----
  incrementPomodoro: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    await get().updateTask(taskId, {
      pomodoroCompleted: task.pomodoroCompleted + 1,
    });
  },

  // addFocusTime is called every second — don't write to DB every second
  // Instead, batch update: only update local state, flush to DB periodically
  addFocusTime: (taskId, seconds) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, totalFocusTime: t.totalFocusTime + seconds }
          : t
      ),
    }));
  },

  // ---- Streak ----
  updateStreak: async () => {
    const { lastActiveDate, streak, userId } = get();
    if (!userId) return;
    const today = new Date().toISOString().split("T")[0];
    if (lastActiveDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const newStreak = lastActiveDate === yesterdayStr ? streak + 1 : 1;

    set({ streak: newStreak, lastActiveDate: today });

    const supabase = getSupabase();
    await supabase
      .from("user_settings")
      .update({ streak: newStreak, last_active_date: today })
      .eq("user_id", userId);
  },
}));
