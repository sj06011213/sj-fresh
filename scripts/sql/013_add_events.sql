-- 013_add_events.sql
-- 커플 일정 공유 테이블. 개인 약속 / 기념일 기록.
-- owner: 'me' (분홍) / 'partner' (하늘) / 'both' (노랑)
-- event_time NULL = 종일(all-day) 표시

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_date date NOT NULL,
  event_time time,                   -- NULL = 종일
  owner text NOT NULL CHECK (owner IN ('me', 'partner', 'both')),
  memo text,
  deleted_at timestamptz,            -- soft delete
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_date_idx
  ON events (event_date ASC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS events_owner_date_idx
  ON events (owner, event_date ASC)
  WHERE deleted_at IS NULL;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all (single-user mode)" ON events;
CREATE POLICY "allow all (single-user mode)"
  ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);
