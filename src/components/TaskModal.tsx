"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Task, TaskCategory, TaskPriority } from "@/lib/types";
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  initialData?: Task | null;
}

export interface TaskFormData {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  deadline: string;
  notes: string;
  pomodoroEstimate: number;
  pomodoroMinutes: number;
}

const EMPTY_FORM: TaskFormData = {
  title: "",
  description: "",
  category: "tugas",
  priority: "medium",
  deadline: "",
  notes: "",
  pomodoroEstimate: 1,
  pomodoroMinutes: 25,
};

export default function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: TaskModalProps) {
  const [form, setForm] = useState<TaskFormData>(EMPTY_FORM);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title: initialData.title,
        description: initialData.description,
        category: initialData.category,
        priority: initialData.priority,
        deadline: initialData.deadline
          ? initialData.deadline.slice(0, 16)
          : "",
        notes: initialData.notes,
        pomodoroEstimate: initialData.pomodoroEstimate,
        pomodoroMinutes: initialData.pomodoroMinutes,
      });
    } else if (isOpen) {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isEdit = !!initialData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
    onClose();
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none transition-colors text-sm";

  const labelClass = "block text-sm font-medium text-foreground-muted mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 animate-overlay"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-background-secondary border border-border rounded-2xl shadow-lg animate-fade-in-scale max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? "Edit Tugas" : "Tambah Tugas Baru"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background-tertiary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className={labelClass}>
              Judul <span className="text-brand-red">*</span>
            </label>
            <input
              ref={titleRef}
              id="task-title"
              type="text"
              placeholder="Contoh: Kerjakan Kuis Statistika"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" className={labelClass}>
              Deskripsi
            </label>
            <textarea
              id="task-desc"
              placeholder="Deskripsi singkat tugas..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
              className={cn(inputClass, "resize-none")}
            />
          </div>

          {/* Category + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-category" className={labelClass}>
                Kategori
              </label>
              <select
                id="task-category"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as TaskCategory,
                  })
                }
                className={cn(inputClass, "cursor-pointer")}
              >
                {(
                  Object.entries(CATEGORY_CONFIG) as [
                    TaskCategory,
                    (typeof CATEGORY_CONFIG)[TaskCategory],
                  ][]
                ).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.emoji} {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-priority" className={labelClass}>
                Prioritas
              </label>
              <select
                id="task-priority"
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority: e.target.value as TaskPriority,
                  })
                }
                className={cn(inputClass, "cursor-pointer")}
              >
                {(
                  Object.entries(PRIORITY_CONFIG) as [
                    TaskPriority,
                    (typeof PRIORITY_CONFIG)[TaskPriority],
                  ][]
                ).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.icon} {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="task-deadline" className={labelClass}>
              Deadline
            </label>
            <input
              id="task-deadline"
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Pomodoro row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-pomo-est" className={labelClass}>
                Estimasi Sesi Pomodoro
              </label>
              <input
                id="task-pomo-est"
                type="number"
                min={1}
                max={50}
                value={form.pomodoroEstimate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pomodoroEstimate: parseInt(e.target.value) || 1,
                  })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="task-pomo-min" className={labelClass}>
                Menit per Sesi
              </label>
              <input
                id="task-pomo-min"
                type="number"
                min={5}
                max={120}
                step={5}
                value={form.pomodoroMinutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pomodoroMinutes: parseInt(e.target.value) || 25,
                  })
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="task-notes" className={labelClass}>
              Catatan / Link
            </label>
            <textarea
              id="task-notes"
              placeholder="Tempelkan link kuis, materi, atau catatan lainnya..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className={cn(inputClass, "resize-none")}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-muted hover:bg-background-tertiary transition-colors text-sm font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors text-sm font-medium cursor-pointer"
            >
              {isEdit ? "Simpan Perubahan" : "Tambah Tugas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
