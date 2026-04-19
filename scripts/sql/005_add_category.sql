-- 005_add_category.sql
-- 재료 보관 위치 구분 (냉장/냉동/팬트리)
-- 기존 재료는 모두 'fridge'로 기본 설정됨 (사용자가 필요시 수정)

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'fridge'
    CHECK (category IN ('fridge', 'freezer', 'pantry'));
