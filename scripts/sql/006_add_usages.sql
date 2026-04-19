-- 006_add_usages.sql
-- 재료 소진 이력 테이블. 각 기록은 "어느 재료를, 얼마, 언제 썼는지" 1개 row.

CREATE TABLE IF NOT EXISTS usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES ingredients(id),
  amount text,                        -- 사용량 (예: "200ml", "한 컵", "2개")
  used_at date NOT NULL DEFAULT current_date,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usages_used_at_idx
  ON usages (used_at DESC);
CREATE INDEX IF NOT EXISTS usages_ingredient_idx
  ON usages (ingredient_id);

ALTER TABLE usages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all (single-user mode)" ON usages;
CREATE POLICY "allow all (single-user mode)"
  ON usages
  FOR ALL
  USING (true)
  WITH CHECK (true);
