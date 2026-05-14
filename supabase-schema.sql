-- =============================================
-- FocusFlow Database Schema
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- Tabel tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'tugas',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  subtasks JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  deadline TIMESTAMPTZ,
  pomodoro_estimate INT DEFAULT 1,
  pomodoro_completed INT DEFAULT 0,
  pomodoro_minutes INT DEFAULT 25,
  total_focus_time INT DEFAULT 0,
  calendar_event_id TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel user_settings (streak, pomodoro settings)
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  streak INT DEFAULT 0,
  last_active_date TEXT,
  pomodoro_settings JSONB DEFAULT '{"focusMinutes":25,"shortBreakMinutes":5,"longBreakMinutes":15,"sessionsBeforeLongBreak":4}'
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "Users can CRUD own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Auto-create user_settings row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
