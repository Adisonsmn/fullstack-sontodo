"use client";

import { useEffect, useRef } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useNotification } from "@/hooks/useNotification";
import { CATEGORY_CONFIG } from "@/lib/types";

const CHECK_INTERVAL_MS = 60_000; // Check every 1 minute

export default function NotificationEngine() {
  const { sendNotification, permission, requestPermission } = useNotification();
  const tasks = useTaskStore((s) => s.tasks);
  const updateTask = useTaskStore((s) => s.updateTask);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if (permission === "default") {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();

      tasks.forEach((task) => {
        // Skip tasks that are done, have no deadline, or already sent reminder
        if (task.status === "done" || !task.deadline || task.reminderSent) {
          return;
        }

        const deadline = new Date(task.deadline);
        const categoryConfig = CATEGORY_CONFIG[task.category];
        const reminderDays = categoryConfig.deadlineReminderDays;

        // Calculate the reminder threshold
        const reminderThreshold = new Date(deadline);
        reminderThreshold.setDate(reminderThreshold.getDate() - reminderDays);

        // If we've passed the reminder threshold, send notification
        if (now >= reminderThreshold) {
          const daysLeft = Math.ceil(
            (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          let urgencyText: string;
          if (daysLeft <= 0) {
            urgencyText = "sudah lewat!";
          } else if (daysLeft === 1) {
            urgencyText = "besok!";
          } else {
            urgencyText = `${daysLeft} hari lagi!`;
          }

          sendNotification(
            `🔔 Deadline ${categoryConfig.label} Semakin Dekat!`,
            {
              body: `"${task.title}" — Deadline ${urgencyText}`,
              tag: `deadline-${task.id}`,
            }
          );

          // Mark as sent so we don't notify again
          updateTask(task.id, { reminderSent: true });
        }
      });
    };

    // Run immediately on mount
    checkDeadlines();

    // Then check periodically
    intervalRef.current = setInterval(checkDeadlines, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tasks, sendNotification, updateTask]);

  // This component renders nothing
  return null;
}
