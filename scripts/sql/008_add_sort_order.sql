-- 008_add_sort_order.sql
-- 재료 사용자 지정 정렬 순서. "내 순서" 모드에서 사용.

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;
