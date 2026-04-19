-- 002_add_quantity.sql
-- 재료 양(quantity) 컬럼 추가. 자유 텍스트 (예: "500ml", "2개", "한 팩").

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS quantity text;
