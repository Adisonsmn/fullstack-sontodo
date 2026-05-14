"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { usePomodoroStore } from "@/store/usePomodoroStore";

interface PomodoroSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PomodoroSettingsModal({
  isOpen,
  onClose,
}: PomodoroSettingsModalProps) {
  const { settings, updateSettings } = usePomodoroStore();
  const [form, setForm] = useState(settings);

  useEffect(() => {
    if (isOpen) {
      setForm(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings(form);
    onClose();
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:border-accent focus:outline-none transition-colors";

  const labelClass = "block text-sm font-medium text-foreground-muted mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-overlay" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-background-secondary border border-border rounded-2xl shadow-lg animate-fade-in-scale">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Pengaturan Pomodoro
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background-tertiary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="pomo-focus" className={labelClass}>
              Durasi Fokus (menit)
            </label>
            <input
              id="pomo-focus"
              type="number"
              min={1}
              max={120}
              value={form.focusMinutes}
              onChange={(e) =>
                setForm({ ...form, focusMinutes: parseInt(e.target.value) || 25 })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="pomo-short" className={labelClass}>
              Istirahat Pendek (menit)
            </label>
            <input
              id="pomo-short"
              type="number"
              min={1}
              max={30}
              value={form.shortBreakMinutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  shortBreakMinutes: parseInt(e.target.value) || 5,
                })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="pomo-long" className={labelClass}>
              Istirahat Panjang (menit)
            </label>
            <input
              id="pomo-long"
              type="number"
              min={1}
              max={60}
              value={form.longBreakMinutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  longBreakMinutes: parseInt(e.target.value) || 15,
                })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="pomo-sessions" className={labelClass}>
              Sesi sebelum Istirahat Panjang
            </label>
            <input
              id="pomo-sessions"
              type="number"
              min={1}
              max={10}
              value={form.sessionsBeforeLongBreak}
              onChange={(e) =>
                setForm({
                  ...form,
                  sessionsBeforeLongBreak: parseInt(e.target.value) || 4,
                })
              }
              className={inputClass}
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
              type="button"
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors text-sm font-medium cursor-pointer"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
