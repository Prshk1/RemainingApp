-- Remaining app Supabase schema (offline-first sync)
-- Run this file in Supabase SQL Editor for initial setup.

BEGIN;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.updated_at IS NULL OR NEW.updated_at = OLD.updated_at THEN
      NEW.updated_at = timezone('utc', now());
    END IF;
  ELSE
    IF NEW.updated_at IS NULL THEN
      NEW.updated_at = timezone('utc', now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.attendance (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  date text NOT NULL,
  time_in text,
  time_out text,
  break_minutes integer NOT NULL DEFAULT 0,
  hours double precision,
  is_manual boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.bonus (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  title text NOT NULL,
  date text NOT NULL,
  hours double precision NOT NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved')),
  note text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.timer_sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  date text NOT NULL,
  start_time text NOT NULL,
  end_time text,
  break_minutes integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.goals (
  user_id text PRIMARY KEY,
  required_hours double precision NOT NULL DEFAULT 400,
  max_hours_per_day double precision NOT NULL DEFAULT 8,
  work_days text NOT NULL DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]',
  lunch_break_enabled boolean NOT NULL DEFAULT true,
  time_format text NOT NULL DEFAULT '12h',
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.qr_image (
  id text PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  local_uri text,
  remote_path text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.attendance_attachments (
  id text PRIMARY KEY,
  entry_id text NOT NULL,
  user_id text NOT NULL,
  file_uri text NOT NULL,
  remote_path text,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT attendance_attachments_entry_fk
    FOREIGN KEY (entry_id) REFERENCES public.attendance(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_updated_at
  ON public.attendance (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date_active
  ON public.attendance (user_id, date)
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS idx_bonus_user_updated_at
  ON public.bonus (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_bonus_user_status
  ON public.bonus (user_id, status)
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_updated_at
  ON public.timer_sessions (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_goals_updated_at
  ON public.goals (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_qr_image_user_updated_at
  ON public.qr_image (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_attachments_user_updated_at
  ON public.attendance_attachments (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_entry
  ON public.attendance_attachments (entry_id);

DROP TRIGGER IF EXISTS set_attendance_updated_at ON public.attendance;
CREATE TRIGGER set_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_bonus_updated_at ON public.bonus;
CREATE TRIGGER set_bonus_updated_at
  BEFORE UPDATE ON public.bonus
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_timer_sessions_updated_at ON public.timer_sessions;
CREATE TRIGGER set_timer_sessions_updated_at
  BEFORE UPDATE ON public.timer_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_goals_updated_at ON public.goals;
CREATE TRIGGER set_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_qr_image_updated_at ON public.qr_image;
CREATE TRIGGER set_qr_image_updated_at
  BEFORE UPDATE ON public.qr_image
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_attachments_updated_at ON public.attendance_attachments;
CREATE TRIGGER set_attachments_updated_at
  BEFORE UPDATE ON public.attendance_attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_image ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendance_owner_select ON public.attendance;
DROP POLICY IF EXISTS attendance_owner_insert ON public.attendance;
DROP POLICY IF EXISTS attendance_owner_update ON public.attendance;
DROP POLICY IF EXISTS attendance_owner_delete ON public.attendance;
CREATE POLICY attendance_owner_select ON public.attendance
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY attendance_owner_insert ON public.attendance
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY attendance_owner_update ON public.attendance
  FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY attendance_owner_delete ON public.attendance
  FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS bonus_owner_select ON public.bonus;
DROP POLICY IF EXISTS bonus_owner_insert ON public.bonus;
DROP POLICY IF EXISTS bonus_owner_update ON public.bonus;
DROP POLICY IF EXISTS bonus_owner_delete ON public.bonus;
CREATE POLICY bonus_owner_select ON public.bonus
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY bonus_owner_insert ON public.bonus
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY bonus_owner_update ON public.bonus
  FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY bonus_owner_delete ON public.bonus
  FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS timer_owner_select ON public.timer_sessions;
DROP POLICY IF EXISTS timer_owner_insert ON public.timer_sessions;
DROP POLICY IF EXISTS timer_owner_update ON public.timer_sessions;
DROP POLICY IF EXISTS timer_owner_delete ON public.timer_sessions;
CREATE POLICY timer_owner_select ON public.timer_sessions
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY timer_owner_insert ON public.timer_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY timer_owner_update ON public.timer_sessions
  FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY timer_owner_delete ON public.timer_sessions
  FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS goals_owner_select ON public.goals;
DROP POLICY IF EXISTS goals_owner_insert ON public.goals;
DROP POLICY IF EXISTS goals_owner_update ON public.goals;
DROP POLICY IF EXISTS goals_owner_delete ON public.goals;
CREATE POLICY goals_owner_select ON public.goals
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY goals_owner_insert ON public.goals
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY goals_owner_update ON public.goals
  FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY goals_owner_delete ON public.goals
  FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS qr_owner_select ON public.qr_image;
DROP POLICY IF EXISTS qr_owner_insert ON public.qr_image;
DROP POLICY IF EXISTS qr_owner_update ON public.qr_image;
DROP POLICY IF EXISTS qr_owner_delete ON public.qr_image;
CREATE POLICY qr_owner_select ON public.qr_image
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY qr_owner_insert ON public.qr_image
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY qr_owner_update ON public.qr_image
  FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY qr_owner_delete ON public.qr_image
  FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS attachments_owner_select ON public.attendance_attachments;
DROP POLICY IF EXISTS attachments_owner_insert ON public.attendance_attachments;
DROP POLICY IF EXISTS attachments_owner_update ON public.attendance_attachments;
DROP POLICY IF EXISTS attachments_owner_delete ON public.attendance_attachments;
CREATE POLICY attachments_owner_select ON public.attendance_attachments
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY attachments_owner_insert ON public.attendance_attachments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY attachments_owner_update ON public.attendance_attachments
  FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY attachments_owner_delete ON public.attendance_attachments
  FOR DELETE USING (auth.uid()::text = user_id);

COMMIT;
