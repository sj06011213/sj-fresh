-- 테이블과 컬럼 구조 확인용
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ingredients'
ORDER BY ordinal_position;
