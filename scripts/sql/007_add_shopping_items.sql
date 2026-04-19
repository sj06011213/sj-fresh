-- 007_add_shopping_items.sql
-- 장볼 리스트 테이블. 장볼 때 사야 할 항목 관리.

CREATE TABLE IF NOT EXISTS shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity text,
  memo text,
  bought_at timestamptz,  -- NULL = 아직 안 삼, 값 = 장봤음
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shopping_items_unbought_idx
  ON shopping_items (created_at DESC)
  WHERE bought_at IS NULL;

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all (single-user mode)" ON shopping_items;
CREATE POLICY "allow all (single-user mode)"
  ON shopping_items
  FOR ALL
  USING (true)
  WITH CHECK (true);
