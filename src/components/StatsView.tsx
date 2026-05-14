"use client";

import { useMemo } from "react";
import {
  Flame,
  CheckCircle2,
  Clock,
  ListChecks,
  AlertTriangle,
} from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { CATEGORY_CONFIG } from "@/lib/types";
import type { TaskCategory } from "@/lib/types";
import { isPast, isWithinInterval, subDays } from "date-fns";

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes} menit`;
  if (minutes === 0) return `${hours} jam`;
  return `${hours} jam ${minutes} menit`;
}

export default function StatsView() {
  const tasks = useTaskStore((s) => s.tasks);
  const streak = useTaskStore((s) => s.streak);
  const lastActiveDate = useTaskStore((s) => s.lastActiveDate);

  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === "done").length;
    const totalFocusTime = tasks.reduce((sum, t) => sum + t.totalFocusTime, 0);

    // Recent completed (last 7 days)
    const recentCompleted = tasks.filter(
      (t) =>
        t.status === "done" &&
        isWithinInterval(new Date(t.updatedAt), {
          start: sevenDaysAgo,
          end: now,
        })
    );

    // Overdue tasks
    const overdueTasks = tasks.filter(
      (t) =>
        t.status !== "done" && t.deadline && isPast(new Date(t.deadline))
    );

    // Focus time per category
    const categoryTime: Record<string, number> = {};
    for (const task of tasks) {
      if (task.totalFocusTime > 0) {
        const key = task.category;
        categoryTime[key] = (categoryTime[key] || 0) + task.totalFocusTime;
      }
    }

    // Sort categories by time (descending)
    const sortedCategories = Object.entries(categoryTime).sort(
      ([, a], [, b]) => b - a
    );

    const maxCategoryTime = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;

    return {
      totalTasks,
      doneTasks,
      totalFocusTime,
      recentCompleted,
      overdueTasks,
      sortedCategories,
      maxCategoryTime,
    };
  }, [tasks]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<ListChecks className="w-5 h-5 text-accent" />}
          label="Total Tugas"
          value={stats.totalTasks.toString()}
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-[var(--color-done)]" />}
          label="Selesai"
          value={stats.doneTasks.toString()}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-brand-orange" />}
          label="Total Fokus"
          value={formatDuration(stats.totalFocusTime)}
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-brand-orange" />}
          label="Streak"
          value={`${streak} hari`}
          sub={lastActiveDate ? `Terakhir: ${lastActiveDate}` : undefined}
        />
      </div>

      {/* Time Tracker per Category */}
      <div className="p-5 rounded-xl border border-border bg-background-secondary">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          ⏱️ Waktu Fokus per Kategori
        </h3>
        {stats.sortedCategories.length === 0 ? (
          <p className="text-sm text-foreground-subtle italic">
            Belum ada data. Mulai sesi Pomodoro untuk melihat statistik.
          </p>
        ) : (
          <div className="space-y-3">
            {stats.sortedCategories.map(([catKey, seconds]) => {
              const config =
                CATEGORY_CONFIG[catKey as TaskCategory];
              const percentage =
                stats.maxCategoryTime > 0
                  ? (seconds / stats.maxCategoryTime) * 100
                  : 0;

              return (
                <div key={catKey}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">
                      {config.emoji} {config.label}
                    </span>
                    <span className="text-xs font-medium text-foreground-muted">
                      {formatDuration(seconds)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-background-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: config.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Completed */}
      <div className="p-5 rounded-xl border border-border bg-background-secondary">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          ✅ Diselesaikan (7 Hari Terakhir)
        </h3>
        {stats.recentCompleted.length === 0 ? (
          <p className="text-sm text-foreground-subtle italic">
            Belum ada tugas yang diselesaikan minggu ini.
          </p>
        ) : (
          <ul className="space-y-2">
            {stats.recentCompleted.map((task) => {
              const config = CATEGORY_CONFIG[task.category];
              return (
                <li key={task.id} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-done)] shrink-0" />
                  <span className="text-sm text-foreground flex-1 truncate">
                    {task.title}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)`,
                      color: config.color,
                    }}
                  >
                    {config.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Overdue Tasks */}
      {stats.overdueTasks.length > 0 && (
        <div className="p-5 rounded-xl border border-brand-red/20 bg-brand-red/5">
          <h3 className="text-sm font-semibold text-brand-red mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Tugas Terlambat ({stats.overdueTasks.length})
          </h3>
          <ul className="space-y-2">
            {stats.overdueTasks.map((task) => {
              const config = CATEGORY_CONFIG[task.category];
              return (
                <li key={task.id} className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-brand-red shrink-0" />
                  <span className="text-sm text-foreground flex-1 truncate">
                    {task.title}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)`,
                      color: config.color,
                    }}
                  >
                    {config.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-background-secondary">
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-foreground-muted">{label}</p>
      {sub && <p className="text-[10px] text-foreground-subtle mt-0.5">{sub}</p>}
    </div>
  );
}
