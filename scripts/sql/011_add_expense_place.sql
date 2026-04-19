-- 011_add_expense_place.sql
-- 지출 기록에 구매처 컬럼 추가 (마트/편의점/시장/기타).
-- NULL 허용이라 기존 데이터 영향 없음.

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS place text;
