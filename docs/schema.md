# DB 스키마

> Supabase PostgreSQL. SQL은 대시보드 → **SQL Editor** 에서 실행.
> 전체 마이그레이션 파일은 `scripts/sql/` 참조.

---

## 테이블 구조 요약

| 테이블 | 용도 | 소프트 삭제 컬럼 |
|---|---|---|
| `ingredients` | 보관 중인 재료 | `consumed_at` |
| `usages` | 재료 소진 이력 로그 | (삭제 안 함) |
| `shopping_items` | 구매 필요 목록 | `deleted_at` |
| `expenses` | 식비 가계부 | `deleted_at` |
| `events` | 커플 일정·기념일 | `deleted_at` |

---

## ingredients (재료)

```sql
CREATE TABLE ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity text,                -- 양 (자유 텍스트이지만 "500ml", "3개" 등 구조화된 형식 권장)
  category text NOT NULL DEFAULT 'fridge'
    CHECK (category IN ('fridge', 'freezer', 'pantry')),
  added_at timestamptz NOT NULL DEFAULT now(),
  expiry_date date,             -- 유통기한 (D-day 카운트)
  opened_at date,               -- 개봉일자 (유통기한 없는 재료용)
  memo text,
  photo_url text,               -- (미사용 — 사진 기능 추후)
  consumed_at timestamptz,      -- soft delete 마커
  created_at timestamptz NOT NULL DEFAULT now(),
  sort_order integer NOT NULL DEFAULT 0  -- "내 순서" 정렬용
);

CREATE INDEX ingredients_active_expiry_idx
  ON ingredients (expiry_date)
  WHERE consumed_at IS NULL;

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all (single-user mode)"
  ON ingredients FOR ALL USING (true) WITH CHECK (true);
```

---

## usages (소진 이력)

```sql
CREATE TABLE usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES ingredients(id),
  amount text,                  -- 사용량 (예: "200ml", "한 컵")
  used_at date NOT NULL DEFAULT current_date,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX usages_used_at_idx ON usages (used_at DESC);
CREATE INDEX usages_ingredient_idx ON usages (ingredient_id);

ALTER TABLE usages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all (single-user mode)"
  ON usages FOR ALL USING (true) WITH CHECK (true);
```

---

## shopping_items (구매 필요)

```sql
CREATE TABLE shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity text,
  memo text,
  bought_at timestamptz,        -- NULL = 아직 안 삼, 타임스탬프 = 장봤음 체크
  deleted_at timestamptz,       -- soft delete
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX shopping_items_unbought_idx
  ON shopping_items (created_at DESC)
  WHERE bought_at IS NULL;

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all (single-user mode)"
  ON shopping_items FOR ALL USING (true) WITH CHECK (true);
```

**조회 규칙:**
- `deleted_at IS NULL` (삭제되지 않음)
- AND (`bought_at IS NULL` OR `bought_at > now() - 24h`)
  - 장봤음 체크한 지 **24시간 지나면 자동 숨김** (데이터는 DB에 남음)

---

## expenses (식비 가계부)

```sql
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spent_at date NOT NULL DEFAULT CURRENT_DATE,
  amount integer NOT NULL CHECK (amount >= 0),    -- 원 단위 정수
  category text NOT NULL CHECK (category IN (
    'groceries', 'dining', 'delivery', 'snack', 'alcohol'
  )),
  description text NOT NULL,    -- 예: "스타벅스 아메리카노"
  place text,                   -- 구매처 (식자재일 때만 UI 노출): 마트/편의점/시장/자유텍스트
  memo text,
  deleted_at timestamptz,       -- soft delete
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX expenses_spent_at_idx
  ON expenses (spent_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX expenses_category_idx
  ON expenses (category, spent_at DESC)
  WHERE deleted_at IS NULL;

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all (single-user mode)"
  ON expenses FOR ALL USING (true) WITH CHECK (true);
```

### 카테고리 매핑
| 내부 키 | 한국어 라벨 | 이모지 | 바 색상 |
|---|---|---|---|
| `groceries` | 식자재 | 🛒 | emerald |
| `dining` | 외식 | 🍽 | amber |
| `delivery` | 배달 | 🛵 | sky |
| `alcohol` | 음주 | 🍺 | violet |
| `snack` | 카페·간식 | ☕ | rose |

---

## events (커플 일정)

```sql
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,                                     -- 일정 제목 (예: "200일 기념일")
  event_date date NOT NULL,                                -- 시작일
  event_time time,                                         -- NULL = 종일(all-day)
  end_date date,                                           -- NULL = 단일 날짜 / NOT NULL = 기간 일정(event_date~end_date)
  owner text NOT NULL CHECK (owner IN ('me', 'partner', 'both')),
  memo text,
  deleted_at timestamptz,                                  -- soft delete
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_end_date_check CHECK (end_date IS NULL OR end_date >= event_date)
);

CREATE INDEX events_date_idx
  ON events (event_date ASC)
  WHERE deleted_at IS NULL;

CREATE INDEX events_owner_date_idx
  ON events (owner, event_date ASC)
  WHERE deleted_at IS NULL;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all (single-user mode)"
  ON events FOR ALL USING (true) WITH CHECK (true);
```

### owner 매핑
| 내부 키 | 한국어 라벨 | 이모지 | 색상 |
|---|---|---|---|
| `me` | 수진 | 🩷 | pink |
| `partner` | 종빈 | 💙 | sky |
| `both` | SJB | 💛 | yellow |

---

## 마이그레이션 파일 (`scripts/sql/`)

| 파일 | 내용 |
|---|---|
| `001_init.sql` | ingredients 초기 생성 |
| `002_add_quantity.sql` | ingredients.quantity 컬럼 |
| `003_add_opened_at.sql` | ingredients.opened_at 컬럼 |
| `004_add_memo.sql` | ingredients.memo 컬럼 |
| `005_add_category.sql` | ingredients.category 컬럼 + CHECK |
| `006_add_usages.sql` | usages 테이블 생성 |
| `007_add_shopping_items.sql` | shopping_items 테이블 생성 |
| `008_add_sort_order.sql` | ingredients.sort_order 컬럼 (내 순서) |
| `009_add_shopping_deleted_at.sql` | shopping_items.deleted_at 컬럼 |
| `010_add_expenses.sql` | expenses 테이블 생성 |
| `011_add_expense_place.sql` | expenses.place 컬럼 |
| `012_add_expense_alcohol_category.sql` | 카테고리 CHECK에 'alcohol' 추가 |
| `013_add_events.sql` | events 테이블 생성 (커플 일정) |
| `014_add_event_end_date.sql` | events.end_date 컬럼 (기간 일정) |

---

## Soft delete 규칙

- **절대 `DELETE` SQL 쓰지 않음.**
- 재료 소비 → `consumed_at = now()` UPDATE
- 구매/지출 삭제 → `deleted_at = now()` UPDATE
- 목록 조회는 해당 컬럼이 `IS NULL` 인 것만

---

## 추후 추가 예정

- **사진 기능** → Supabase Storage에 업로드 후 URL을 `ingredients.photo_url`에 저장
- **로그인** → `user_id` 컬럼 추가 + RLS 정책을 `auth.uid() = user_id`로 강화
- **구매↔가계부 연동** → shopping_items에 `price` 컬럼 추가하여 장봤음 체크 시 expenses로 복사
