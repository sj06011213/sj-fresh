-- 009_add_shopping_deleted_at.sql
-- 장볼 항목 소프트 삭제용 컬럼. NULL = 활성, 값 있음 = 삭제됨.

ALTER TABLE shopping_items
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
