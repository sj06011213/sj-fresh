-- 010_add_expenses.sql
-- 식비 가계부 테이블. 지출 내역(식자재/외식/배달/카페·간식) 기록.

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spent_at date NOT NULL DEFAULT CURRENT_DATE,
  amount integer NOT NULL CHECK (amount >= 0),  -- 원 단위 정수
  category text NOT NULL CHECK (category IN ('groceries', 'dining', 'delivery', 'snack')),
  description text NOT NULL,  -- 어디서/뭘 샀는지 (예: 스타벅스 아메리카노)
  memo text,
  deleted_at timestamptz,     -- soft delete
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_spent_at_idx
  ON expenses (spent_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS expenses_category_idx
  ON expenses (category, spent_at DESC)
  WHERE deleted_at IS NULL;

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all (single-user mode)" ON expenses;
CREATE POLICY "allow all (single-user mode)"
  ON expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);
