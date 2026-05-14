"use client";

import { useState, useCallback } from "react";
import type { Task } from "@/lib/types";
import { useTaskStore } from "@/store/useTaskStore";
import { useAuth } from "@/components/AuthProvider";

/**
 * Google Calendar integration hook.
 * Uses the provider_token from Supabase Google OAuth session
 * to create/delete events on the user's Google Calendar.
 */
export function useGoogleCalendar() {
  const [syncingTaskId, setSyncingTaskId] = useState<string | null>(null);
  const updateTask = useTaskStore((s) => s.updateTask);
  const { providerToken } = useAuth();

  const syncToCalendar = useCallback(
    async (task: Task) => {
      if (!task.deadline || !providerToken) {
        if (!providerToken) {
          console.warn("No Google provider token. User may need to re-login.");
        }
        return;
      }

      setSyncingTaskId(task.id);

      try {
        const endTime = new Date(
          new Date(task.deadline).getTime() + 60 * 60 * 1000
        ).toISOString();

        const response = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${providerToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              summary: `[FocusFlow] ${task.title}`,
              description: task.description || task.notes || "",
              start: { dateTime: task.deadline, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
              end: { dateTime: endTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
              reminders: {
                useDefault: false,
                overrides: [
                  { method: "popup", minutes: 60 },
                  { method: "popup", minutes: 1440 }, // 1 day before
                ],
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          await updateTask(task.id, { calendarEventId: data.id });
        } else {
          const err = await response.text();
          console.error("Google Calendar API error:", err);
        }
      } catch (error) {
        console.error("Failed to sync to Google Calendar:", error);
      } finally {
        setSyncingTaskId(null);
      }
    },
    [updateTask, providerToken]
  );

  const removeFromCalendar = useCallback(
    async (task: Task) => {
      if (!task.calendarEventId || !providerToken) return;

      setSyncingTaskId(task.id);

      try {
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.calendarEventId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${providerToken}`,
            },
          }
        );

        await updateTask(task.id, { calendarEventId: null });
      } catch (error) {
        console.error("Failed to remove from Google Calendar:", error);
      } finally {
        setSyncingTaskId(null);
      }
    },
    [updateTask, providerToken]
  );

  return { syncToCalendar, removeFromCalendar, syncingTaskId, hasToken: !!providerToken };
}
