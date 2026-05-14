"use client";

import type { Task, TaskStatus } from "@/lib/types";
import { STATUS_CONFIG } from "@/lib/types";
import TaskCard from "./TaskCard";

interface KanbanBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
}

const COLUMNS: TaskStatus[] = ["todo", "in-progress", "done"];

export default function KanbanBoard({ tasks, onEdit }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
      {COLUMNS.map((status) => {
        const config = STATUS_CONFIG[status];
        const columnTasks = tasks.filter((t) => t.status === status);

        return (
          <div key={status} className="flex flex-col">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <h3 className="text-sm font-semibold text-foreground">
                {config.label}
              </h3>
              <span className="text-xs text-foreground-subtle bg-background-tertiary px-1.5 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>

            {/* Column body */}
            <div className="flex-1 space-y-3 p-3 rounded-xl bg-background-tertiary/50 border border-border min-h-[200px]">
              {columnTasks.length === 0 ? (
                <p className="text-xs text-foreground-subtle text-center py-8 italic">
                  Tidak ada tugas
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onEdit={onEdit} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
