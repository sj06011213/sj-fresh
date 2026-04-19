-- 003_add_opened_at.sql
-- 개봉일자 컬럼 추가. 유통기한(expiry_date) 대신 개봉일자로 관리하고 싶은 재료용.

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS opened_at date;
