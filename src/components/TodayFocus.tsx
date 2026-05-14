"use client";

import { useMemo } from "react";
import { Flame, Calendar, AlertTriangle, CheckCircle2, Play } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from "@/lib/types";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { id as idLocale } from "date-fns/locale/id";

interface TodayFocusProps {
  onEdit: (task: Task) => void;
}

export default function TodayFocus({ onEdit }: TodayFocusProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const streak = useTaskStore((s) => s.streak);
  const { startTimer, activeTaskId } = usePomodoroStore();

  const todayTasks = useMemo(() => {
    const now = new Date();
    return tasks
      .filter((t) => {
        if (t.status === "done") return false;
        // In progress tasks
        if (t.status === "in-progress") return true;
        // High priority
        if (t.priority === "high") return true;
        // Deadline today or tomorrow
        if (t.deadline) {
          const dl = new Date(t.deadline);
          return isToday(dl) || isTomorrow(dl) || isPast(dl);
        }
        return false;
      })
      .sort((a, b) => {
        // Overdue first, then today, then tomorrow, then by priority
        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && b.deadline) return 1;
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }, [tasks]);

  const overdueTasks = todayTasks.filter(
    (t) => t.deadline && isPast(new Date(t.deadline))
  );

  // Greeting based on time
  const hour = new Date().getHours();
  let greeting = "Selamat pagi";
  if (hour >= 11 && hour < 15) greeting = "Selamat siang";
  else if (hour >= 15 && hour < 18) greeting = "Selamat sore";
  else if (hour >= 18) greeting = "Selamat malam";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting + Streak */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{greeting} 👋</h2>
          <p className="text-sm text-foreground-muted mt-1">
            {todayTasks.length === 0
              ? "Tidak ada tugas mendesak. Nikmati harimu!"
              : `Kamu punya ${todayTasks.length} tugas yang perlu diperhatikan hari ini.`}
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-background-secondary border border-border">
            <Flame className="w-5 h-5 text-brand-orange" />
            <span className="text-lg font-bold text-foreground">{streak}</span>
            <span className="text-xs text-foreground-muted">hari</span>
          </div>
        )}
      </div>

      {/* Overdue warning */}
      {overdueTasks.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-brand-red/10 border border-brand-red/20">
          <AlertTriangle className="w-5 h-5 text-brand-red shrink-0" />
          <p className="text-sm text-brand-red font-medium">
            {overdueTasks.length} tugas sudah melewati deadline!
          </p>
        </div>
      )}

      {/* Task list */}
      {todayTasks.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-[var(--color-done)] mx-auto mb-3" />
          <p className="text-foreground-muted text-sm">
            Semua tugas terselesaikan. Bagus! 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {todayTasks.map((task) => {
            const category = CATEGORY_CONFIG[task.category];
            const priority = PRIORITY_CONFIG[task.priority];
            const isOverdue = task.deadline && isPast(new Date(task.deadline));
            const isActive = activeTaskId === task.id;

            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border border-border bg-background-secondary hover:border-border-hover transition-colors group",
                  isOverdue && "border-brand-red/30"
                )}
              >
                {/* Priority dot */}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: priority.color }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => onEdit(task)}
                    className="text-sm font-medium text-foreground hover:text-accent transition-colors text-left truncate block w-full cursor-pointer"
                  >
                    {task.title}
                  </button>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${category.color} 15%, transparent)`,
                        color: category.color,
                      }}
                    >
                      {category.emoji} {category.label}
                    </span>
                    {task.deadline && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px]",
                          isOverdue
                            ? "text-brand-red font-medium"
                            : "text-foreground-subtle"
                        )}
                      >
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.deadline), "dd MMM, HH:mm", {
                          locale: idLocale,
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pomodoro start */}
                {!isActive ? (
                  <button
                    onClick={() => startTimer(task.id)}
                    className="p-2 rounded-lg hover:bg-background-tertiary opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Mulai Fokus"
                  >
                    <Play className="w-4 h-4 text-brand-orange" />
                  </button>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-red text-white animate-pulse">
                    FOKUS
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
