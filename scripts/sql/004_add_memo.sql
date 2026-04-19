-- 004_add_memo.sql
-- 재료별 메모 컬럼 추가. 자유 텍스트 (여러 줄 가능).

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS memo text;
