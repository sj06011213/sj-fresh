-- 001_init.sql
-- sj-fresh 초기 스키마
-- 안전하게 여러 번 실행 가능하도록 IF NOT EXISTS / 멱등하게 작성

-- 재료 테이블
CREATE TABLE IF NOT EXISTS ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  expiry_date date,
  photo_url text,
  consumed_at timestamptz,  -- soft delete 마커: 소비한 시각
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 활성(미소비) 재료 유통기한 정렬 가속
CREATE INDEX IF NOT EXISTS ingredients_active_expiry_idx
  ON ingredients (expiry_date)
  WHERE consumed_at IS NULL;

-- Row Level Security 켜기
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- 임시 정책: 1인 사용 단계 전체 허용
-- ⚠️ 로그인/다중 사용자 붙일 때 반드시 좁혀야 함
DROP POLICY IF EXISTS "allow all (single-user mode)" ON ingredients;
CREATE POLICY "allow all (single-user mode)"
  ON ingredients
  FOR ALL
  USING (true)
  WITH CHECK (true);
