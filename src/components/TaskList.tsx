"use client";

import { useState, useMemo } from "react";
import { ListFilter, Search, LayoutList, Columns3 } from "lucide-react";
import type { Task, TaskCategory, TaskPriority, TaskStatus } from "@/lib/types";
import { CATEGORY_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/types";
import TaskCard from "./TaskCard";
import KanbanBoard from "./KanbanBoard";
import { cn } from "@/lib/utils";

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
}

type FilterCategory = TaskCategory | "all";
type FilterPriority = TaskPriority | "all";
type FilterStatus = TaskStatus | "all";
type ViewMode = "list" | "kanban";

export default function TaskList({ tasks, onEdit }: TaskListProps) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (
        search &&
        !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !t.description.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (filterCategory !== "all" && t.category !== filterCategory)
        return false;
      if (filterPriority !== "all" && t.priority !== filterPriority)
        return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      return true;
    });
  }, [tasks, search, filterCategory, filterPriority, filterStatus]);

  const activeFilterCount = [filterCategory, filterPriority, filterStatus].filter(
    (f) => f !== "all"
  ).length;

  const chipClass = (active: boolean) =>
    cn(
      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap",
      active
        ? "border-accent bg-accent text-white"
        : "border-border bg-background-secondary text-foreground-muted hover:border-border-hover"
    );

  return (
    <div className="space-y-4">
      {/* Search + Filter toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
          <input
            type="text"
            placeholder="Cari tugas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background-secondary text-sm placeholder:text-foreground-subtle focus:border-accent focus:outline-none transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "p-2.5 rounded-lg border transition-colors cursor-pointer relative",
            showFilters
              ? "border-accent bg-accent text-white"
              : "border-border bg-background-secondary text-foreground-muted hover:border-border-hover"
          )}
          title="Filter"
        >
          <ListFilter className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-red text-white text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* View toggle */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2.5 transition-colors cursor-pointer",
              viewMode === "list"
                ? "bg-accent text-white"
                : "bg-background-secondary text-foreground-muted hover:bg-background-tertiary"
            )}
            title="Tampilan List"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={cn(
              "p-2.5 transition-colors cursor-pointer",
              viewMode === "kanban"
                ? "bg-accent text-white"
                : "bg-background-secondary text-foreground-muted hover:bg-background-tertiary"
            )}
            title="Tampilan Kanban"
          >
            <Columns3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter chips */}
      {showFilters && (
        <div className="space-y-3 p-4 rounded-xl border border-border bg-background-secondary animate-fade-in">
          {/* Category */}
          <div>
            <p className="text-xs font-medium text-foreground-muted mb-2">
              Kategori
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterCategory("all")}
                className={chipClass(filterCategory === "all")}
              >
                Semua
              </button>
              {(
                Object.entries(CATEGORY_CONFIG) as [
                  TaskCategory,
                  (typeof CATEGORY_CONFIG)[TaskCategory],
                ][]
              ).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setFilterCategory(key)}
                  className={chipClass(filterCategory === key)}
                >
                  {cfg.emoji} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <p className="text-xs font-medium text-foreground-muted mb-2">
              Prioritas
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterPriority("all")}
                className={chipClass(filterPriority === "all")}
              >
                Semua
              </button>
              {(
                Object.entries(PRIORITY_CONFIG) as [
                  TaskPriority,
                  (typeof PRIORITY_CONFIG)[TaskPriority],
                ][]
              ).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setFilterPriority(key)}
                  className={chipClass(filterPriority === key)}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-medium text-foreground-muted mb-2">
              Status
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus("all")}
                className={chipClass(filterStatus === "all")}
              >
                Semua
              </button>
              {(
                Object.entries(STATUS_CONFIG) as [
                  TaskStatus,
                  (typeof STATUS_CONFIG)[TaskStatus],
                ][]
              ).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={chipClass(filterStatus === key)}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-foreground-subtle">
        {filtered.length} tugas{search || activeFilterCount > 0 ? " ditemukan" : ""}
      </p>

      {/* Task cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-foreground-muted text-sm">
            {tasks.length === 0
              ? "Belum ada tugas. Mulai dengan menambahkan tugas pertamamu!"
              : "Tidak ada tugas yang cocok dengan filter."}
          </p>
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard tasks={filtered} onEdit={onEdit} />
      ) : (
        <div className="grid gap-3">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
