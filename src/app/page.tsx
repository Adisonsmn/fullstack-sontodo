"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Settings,
  Focus,
  ClipboardList,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import TaskModal, { type TaskFormData } from "@/components/TaskModal";
import TaskList from "@/components/TaskList";
import ThemeToggle from "@/components/ThemeToggle";
import PomodoroEngine from "@/components/PomodoroEngine";
import PomodoroWidget from "@/components/PomodoroWidget";
import PomodoroSettingsModal from "@/components/PomodoroSettingsModal";
import NotificationEngine from "@/components/NotificationEngine";
import TodayFocus from "@/components/TodayFocus";
import StatsView from "@/components/StatsView";
import LoginPage from "@/components/LoginPage";
import { useAuth } from "@/components/AuthProvider";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "focus" | "tasks" | "stats";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "focus", label: "Fokus", icon: <Focus className="w-4 h-4" /> },
  { key: "tasks", label: "Tugas", icon: <ClipboardList className="w-4 h-4" /> },
  { key: "stats", label: "Statistik", icon: <BarChart3 className="w-4 h-4" /> },
];

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { tasks, addTask, updateTask, fetchTasks, setUserId, fetchUserSettings, loading: tasksLoading } =
    useTaskStore();
  const pomodoroStore = usePomodoroStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("focus");

  // Fetch tasks when user logs in
  useEffect(() => {
    if (user) {
      setUserId(user.id);
      pomodoroStore.setUserId(user.id);
      fetchTasks();
      fetchUserSettings();
      pomodoroStore.fetchSettings(user.id);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-orange text-white flex items-center justify-center font-bold text-base tracking-tighter animate-pulse shadow-md shadow-brand-orange/20">
            FF
          </div>
          <span className="text-lg text-foreground-muted">Memuat...</span>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  const handleOpenCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSubmit = (data: TaskFormData) => {
    if (editingTask) {
      updateTask(editingTask.id, {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
        notes: data.notes,
        pomodoroEstimate: data.pomodoroEstimate,
        pomodoroMinutes: data.pomodoroMinutes,
      });
    } else {
      addTask({
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: "todo",
        subtasks: [],
        notes: data.notes,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
        pomodoroEstimate: data.pomodoroEstimate,
        pomodoroMinutes: data.pomodoroMinutes,
      });
    }
  };

  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const progressCount = tasks.filter((t) => t.status === "in-progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  // User avatar from Google
  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName = user.user_metadata?.full_name || user.email;

  return (
    <>
      {/* Global engines (invisible) */}
      <PomodoroEngine />
      <NotificationEngine />

      <main className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-orange text-white flex items-center justify-center font-bold text-sm tracking-tighter shadow-sm shadow-brand-orange/20">
                FF
              </div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                FocusFlow
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-lg border border-border bg-background-secondary hover:border-border-hover transition-colors cursor-pointer"
                title="Pengaturan Pomodoro"
              >
                <Settings className="w-4 h-4 text-foreground-muted" />
              </button>
              <ThemeToggle />
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>

              {/* User avatar + logout */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-border">
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt={displayName || "User"}
                    className="w-7 h-7 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                )}
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg hover:bg-background-tertiary transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-foreground-muted" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab navigation + Stats */}
        <div className="border-b border-border bg-background-secondary">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                      activeTab === tab.key
                        ? "border-accent text-accent"
                        : "border-transparent text-foreground-muted hover:text-foreground"
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-todo)" }} />
                  <span className="text-foreground-muted">{todoCount}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-progress)" }} />
                  <span className="text-foreground-muted">{progressCount}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-done)" }} />
                  <span className="text-foreground-muted">{doneCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className={cn(
            "flex-1 mx-auto w-full px-4 py-6",
            activeTab === "tasks" ? "max-w-5xl" : "max-w-4xl"
          )}
        >
          {tasksLoading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 rounded-xl bg-brand-orange text-white flex items-center justify-center font-bold text-base tracking-tighter animate-pulse shadow-md shadow-brand-orange/20 mx-auto mb-3">
                FF
              </div>
              <p className="text-sm text-foreground-muted">Memuat tugas...</p>
            </div>
          ) : (
            <>
              {activeTab === "focus" && <TodayFocus onEdit={handleOpenEdit} />}
              {activeTab === "tasks" && (
                <TaskList tasks={tasks} onEdit={handleOpenEdit} />
              )}
              {activeTab === "stats" && <StatsView />}
            </>
          )}
        </div>

        {/* Floating Pomodoro Widget */}
        <PomodoroWidget />

        {/* Modals */}
        <TaskModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          initialData={editingTask}
        />
        <PomodoroSettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </main>
    </>
  );
}
