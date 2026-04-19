# DB 스키마

> Supabase 대시보드 → **SQL Editor**에서 아래 SQL을 실행하세요.

## ingredients 테이블

```sql
-- 재료 테이블
CREATE TABLE ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity text,            -- 양 (자유 텍스트: "500ml", "2개", "한 팩")
  added_at timestamptz NOT NULL DEFAULT now(),
  expiry_date date,
  photo_url text,
  consumed_at timestamptz,  -- soft delete 마커: 소비한 시각
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 활성(미소비) 재료 유통기한 정렬 가속
CREATE INDEX ingredients_active_expiry_idx
  ON ingredients (expiry_date)
  WHERE consumed_at IS NULL;

-- Row Level Security 켜기 (보안 기본값)
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- 임시 정책: 1인 사용 단계에선 모두 허용
-- ⚠️ 로그인/다중 사용자 붙일 때 반드시 좁혀야 함
CREATE POLICY "allow all (single-user mode)"
  ON ingredients
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Soft delete 규칙
- **절대 DELETE 쿼리 쓰지 않음.**
- 재료 "소비" 처리 시 `consumed_at = now()` UPDATE만.
- 목록 조회는 `WHERE consumed_at IS NULL` 필터로.
- 이력 조회는 `WHERE consumed_at IS NOT NULL` 필터로.

## 추후 추가 예정
- 사진 기능 → Supabase Storage에 업로드 후 URL을 `photo_url`에 저장
- 로그인 기능 → `user_id` 컬럼 추가 + RLS 정책을 `auth.uid() = user_id`로 변경
