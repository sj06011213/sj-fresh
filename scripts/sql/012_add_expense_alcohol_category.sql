-- 012_add_expense_alcohol_category.sql
-- 지출 카테고리에 '음주(alcohol)' 추가.

ALTER TABLE expenses
  DROP CONSTRAINT IF EXISTS expenses_category_check;

ALTER TABLE expenses
  ADD CONSTRAINT expenses_category_check
  CHECK (category IN ('groceries', 'dining', 'delivery', 'snack', 'alcohol'));
