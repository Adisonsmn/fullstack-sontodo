"use client";

import { useState } from "react";
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Calendar,
  CalendarCheck,
  Timer,
  CheckSquare,
  Square,
  ExternalLink,
  Play,
  Loader2,
} from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { CATEGORY_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/types";
import { useTaskStore } from "@/store/useTaskStore";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { id as idLocale } from "date-fns/locale/id";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newSubTask, setNewSubTask] = useState("");
  const { deleteTask, updateTask, addSubTask, toggleSubTask, deleteSubTask } =
    useTaskStore();
  const { startTimer, activeTaskId } = usePomodoroStore();
  const isActivePomodoro = activeTaskId === task.id;
  const { syncToCalendar, removeFromCalendar, syncingTaskId } = useGoogleCalendar();
  const isSyncing = syncingTaskId === task.id;
  const isSynced = !!task.calendarEventId;

  const category = CATEGORY_CONFIG[task.category];
  const priority = PRIORITY_CONFIG[task.priority];
  const status = STATUS_CONFIG[task.status];

  const completedSubTasks = task.subtasks.filter((st) => st.completed).length;
  const totalSubTasks = task.subtasks.length;
  const hasDeadline = !!task.deadline;
  const deadlinePast = hasDeadline && isPast(new Date(task.deadline!));

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateTask(task.id, { status: newStatus });
  };

  const handleAddSubTask = () => {
    if (!newSubTask.trim()) return;
    addSubTask(task.id, newSubTask.trim());
    setNewSubTask("");
  };

  const handleDelete = () => {
    if (window.confirm(`Hapus tugas "${task.title}"?`)) {
      deleteTask(task.id);
    }
  };

  // Extract URLs from notes for quick-link display
  const noteUrls = task.notes.match(/https?:\/\/[^\s]+/g) || [];

  return (
    <div
      className={cn(
        "card p-4 animate-fade-in",
        task.status === "done" && "opacity-60"
      )}
    >
      {/* Top row: Category badge + Priority + Actions */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category badge */}
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `color-mix(in srgb, ${category.color} 15%, transparent)`,
              color: category.color,
            }}
          >
            {category.emoji} {category.label}
          </span>

          {/* Priority */}
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `color-mix(in srgb, ${priority.color} 12%, transparent)`,
              color: priority.color,
            }}
          >
            {priority.icon} {priority.label}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {task.status !== "done" && !isActivePomodoro && (
            <button
              onClick={() => startTimer(task.id)}
              className="p-1.5 rounded-md hover:bg-background-tertiary transition-colors cursor-pointer"
              title="Mulai Fokus"
            >
              <Play className="w-4 h-4 text-brand-orange" />
            </button>
          )}
          {isActivePomodoro && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-red text-white animate-pulse">
              FOKUS
            </span>
          )}
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-md hover:bg-background-tertiary transition-colors cursor-pointer"
            title="Edit"
          >
            <Pencil className="w-4 h-4 text-foreground-muted" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-md hover:bg-background-tertiary transition-colors cursor-pointer"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4 text-brand-red" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3
        className={cn(
          "text-base font-semibold text-foreground mb-1",
          task.status === "done" && "line-through"
        )}
      >
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-foreground-muted mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Meta row: Deadline + Pomodoro + Subtask progress */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-foreground-muted mb-3">
        {/* Status selector */}
        <select
          value={task.status}
          onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
          className="px-2 py-1 rounded-md border border-border bg-background text-xs cursor-pointer focus:outline-none"
          style={{ color: status.color }}
        >
          {(
            Object.entries(STATUS_CONFIG) as [
              TaskStatus,
              (typeof STATUS_CONFIG)[TaskStatus],
            ][]
          ).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.label}
            </option>
          ))}
        </select>

        {/* Deadline */}
        {hasDeadline && (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              deadlinePast && task.status !== "done" && "text-brand-red font-medium"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(task.deadline!), "dd MMM yyyy, HH:mm", {
              locale: idLocale,
            })}
            {task.status !== "done" && (
              <span className="text-foreground-subtle">
                ({formatDistanceToNow(new Date(task.deadline!), {
                  addSuffix: true,
                  locale: idLocale,
                })})
              </span>
            )}
          </span>
        )}

        {/* Pomodoro */}
        <span className="inline-flex items-center gap-1">
          <Timer className="w-3.5 h-3.5" />
          {task.pomodoroCompleted}/{task.pomodoroEstimate} sesi
        </span>

        {/* Subtask progress */}
        {totalSubTasks > 0 && (
          <span className="inline-flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5" />
            {completedSubTasks}/{totalSubTasks}
          </span>
        )}

        {/* Google Calendar sync */}
        {hasDeadline && (
          isSynced ? (
            <button
              onClick={() => removeFromCalendar(task)}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 text-[var(--color-done)] hover:opacity-70 transition-opacity cursor-pointer disabled:opacity-50"
              title="Tersinkronisasi ke Google Calendar (klik untuk hapus)"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              GCal
            </button>
          ) : (
            <button
              onClick={() => syncToCalendar(task)}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 text-accent hover:underline cursor-pointer disabled:opacity-50"
              title="Sinkronkan ke Google Calendar"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Calendar className="w-3.5 h-3.5" />
              )}
              {isSyncing ? "Syncing..." : "Sync GCal"}
            </button>
          )
        )}
      </div>

      {/* Quick links from notes */}
      {noteUrls.length > 0 && !expanded && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {noteUrls.slice(0, 2).map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              {new URL(url).hostname}
            </a>
          ))}
          {noteUrls.length > 2 && (
            <span className="text-xs text-foreground-subtle">
              +{noteUrls.length - 2} lainnya
            </span>
          )}
        </div>
      )}

      {/* Subtask progress bar */}
      {totalSubTasks > 0 && (
        <div className="w-full h-1.5 bg-background-tertiary rounded-full mb-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(completedSubTasks / totalSubTasks) * 100}%`,
              backgroundColor: "var(--color-done)",
            }}
          />
        </div>
      )}

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" /> Sembunyikan detail
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" /> Lihat detail
          </>
        )}
      </button>

      {/* Expanded section */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-4 animate-fade-in">
          {/* Sub-tasks */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              Sub-tasks
            </h4>
            {task.subtasks.length === 0 && (
              <p className="text-xs text-foreground-subtle italic">
                Belum ada sub-task.
              </p>
            )}
            <ul className="space-y-1.5">
              {task.subtasks.map((st) => (
                <li key={st.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleSubTask(task.id, st.id)}
                    className="shrink-0 cursor-pointer"
                  >
                    {st.completed ? (
                      <CheckSquare className="w-4 h-4 text-[var(--color-done)]" />
                    ) : (
                      <Square className="w-4 h-4 text-foreground-subtle" />
                    )}
                  </button>
                  <span
                    className={cn(
                      "text-sm flex-1",
                      st.completed &&
                        "line-through text-foreground-subtle"
                    )}
                  >
                    {st.title}
                  </span>
                  <button
                    onClick={() => deleteSubTask(task.id, st.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-background-tertiary transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3 text-foreground-subtle" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Add sub-task input */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                placeholder="Tambah sub-task..."
                value={newSubTask}
                onChange={(e) => setNewSubTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubTask()}
                className="flex-1 px-2.5 py-1.5 text-sm rounded-md border border-border bg-background placeholder:text-foreground-subtle focus:border-accent focus:outline-none transition-colors"
              />
              <button
                onClick={handleAddSubTask}
                disabled={!newSubTask.trim()}
                className="p-1.5 rounded-md bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              Catatan / Link
            </h4>
            {task.notes ? (
              <div className="text-sm text-foreground-muted bg-background-tertiary rounded-lg p-3 whitespace-pre-wrap break-words leading-relaxed">
                {task.notes}
              </div>
            ) : (
              <p className="text-xs text-foreground-subtle italic">
                Belum ada catatan. Klik edit untuk menambahkan.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
