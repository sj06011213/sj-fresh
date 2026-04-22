-- 014_add_event_end_date.sql
-- events.end_date 컬럼 추가: 여러 날에 걸친 기간 일정 지원.
-- NULL = 단일 날짜 일정. NOT NULL이면 event_date~end_date 기간.
-- 기간 일정은 앱 단에서 종일(event_time IS NULL)로 강제.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS end_date date;

-- 종료 날짜는 시작 날짜와 같거나 나중이어야 함
ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_end_date_check;

ALTER TABLE events
  ADD CONSTRAINT events_end_date_check
  CHECK (end_date IS NULL OR end_date >= event_date);
