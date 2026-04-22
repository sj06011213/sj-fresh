# 수진프레시 기획 문서

> 어떻게 만들지, 화면 흐름, 의사결정 로그.

---

## 기술 스택

- **프론트엔드**: Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4
- **폰트**: Google Fonts — **Jua (주아체)** / Geist Mono
- **백엔드**: 없음 (Next.js Server Action이 직접 Supabase 호출)
- **DB / 인증 / 저장소**: Supabase (PostgreSQL + Auth + Storage)
- **드래그앤드롭**: @dnd-kit (재료 "내 순서" 정렬용)
- **배포**: Netlify (GitHub `main` 브랜치 자동 배포)

---

## 프로젝트 구조

```
sj-fresh/
├── app/
│   ├── layout.tsx            # 최상위 레이아웃, 폰트 로딩
│   ├── page.tsx              # 데이터 fetch → HomeView 렌더
│   ├── globals.css           # Tailwind + 변수 + 폰트 매핑
│   │
│   ├── HomeView.tsx          # (client) 헤더 로고 + 탭 + 상태 허브
│   ├── IngredientList.tsx    # 재료 목록 + 필터 + 정렬 + DnD
│   ├── AddIngredientButton.tsx
│   ├── EditIngredientDialog.tsx
│   ├── RecordUsageButton.tsx # 🍴 소진 기록 FAB
│   │
│   ├── ShoppingList.tsx      # 구매 목록 + 체크 + 음성인식
│   ├── EditShoppingDialog.tsx
│   │
│   ├── ExpenseView.tsx       # 가계부 컨테이너 (월 이동 + 비율 바)
│   ├── ExpenseList.tsx       # 날짜별 그룹 목록
│   ├── AddExpenseButton.tsx
│   ├── EditExpenseDialog.tsx
│   │
│   ├── ScheduleView.tsx      # 일정 컨테이너 (리스트/달력 토글 + 선택 삭제)
│   ├── CalendarView.tsx      # 월간 달력 뷰 (날짜 셀 + 선택일 일정 리스트)
│   ├── AddEventButton.tsx
│   ├── EditEventDialog.tsx
│   │
│   ├── Modal.tsx             # 공용 모달 쉘 (백드롭 + Esc + 스크롤 잠금)
│   ├── UndoToast.tsx         # 5초 실행 취소 토스트
│   ├── QuantityInput.tsx     # 숫자 + 단위 선택 (개/g/kg/ml/L/기타)
│   ├── PlaceInput.tsx        # 구매처 선택 (마트/편의점/시장/기타)
│   ├── VoiceInputButton.tsx  # 🎤 Web Speech API 래퍼
│   ├── AutoResizeTextarea.tsx # 내용 길이에 맞춰 자동 늘어나는 textarea
│   │
│   └── actions/
│       ├── ingredients.ts    # 재료 서버 액션
│       ├── shopping.ts       # 구매 서버 액션
│       ├── expenses.ts       # 지출 서버 액션
│       └── events.ts         # 일정 서버 액션
│
├── lib/
│   ├── supabase.ts           # Supabase 클라이언트 + 타입 정의
│   └── utils/
│       ├── date.ts           # today(), formatDateLabel()
│       ├── currency.ts       # formatKRW()
│       ├── month.ts          # toMonthKey(), shiftMonth(), monthLabel()
│       ├── quantity.ts       # 단위 파싱·변환·포맷 (L↔ml, kg↔g)
│       ├── voice-parser.ts   # parseShoppingText() — 음성 자연어 → 이름+양
│       └── events.ts         # 일정 owner 색상, 기간/시간 포맷, eventOccursOn
│
├── scripts/sql/              # DB 마이그레이션 (001~014)
├── scripts/run-sql.mjs       # Claude가 SQL 파일 실행 (DATABASE_URL 사용)
├── scripts/query.mjs         # Claude가 SELECT 쿼리 확인
├── public/                   # 정적 에셋 (로고 등)
└── docs/                     # 문서
```

---

## 화면 흐름

```
메인 페이지
  ├─ 헤더: SJB 로고 (클릭 → 재료 탭 전체 보기로 이동)
  ├─ 탭: 🥬 재료 / 🛒 구매 / 💰 가계부 / 🗓️ 일정
  │
  ├─ 🥬 재료 탭
  │   ├─ 카테고리 칩: 전체 / 냉장 / 냉동 / 팬트리 (개수 표시)
  │   ├─ 정렬: ⏰ 임박순 / 📅 오래된순 / ✋ 내 순서
  │   │   └─ 내 순서 선택 시 → ✏️ 편집 버튼 → 드래그 아이콘 ON
  │   ├─ 재료 카드: 탭 → 수정 다이얼로그 / 소비 버튼 → 목록 제외
  │   ├─ ➕ FAB (오른쪽 아래): 재료 추가
  │   └─ 🍴 FAB (더 위): 소진 기록 (단위 일치 시 자동 차감)
  │
  ├─ 🛒 구매 탭
  │   ├─ 상단 입력줄: 이름 + 🎤 음성 + ➕
  │   ├─ 음성 모드: 연속 인식 (마이크 토글)
  │   └─ 카드: 체크 / 탭(수정) / × (삭제+실행취소)
  │
  ├─ 💰 가계부 탭
  │   ├─ 월 네비 (◀ ▶) + 이번 달 합계
  │   ├─ 카테고리 비율 바 (5개 카테고리)
  │   ├─ 날짜별 그룹 목록
  │   └─ ➕ FAB: 지출 기록 (식자재 선택 시 구매처 입력 노출)
  │
  └─ 🗓️ 일정 탭
      ├─ 상단 액션 바:
      │     [📅 달력으로 보기]  [🗑 선택 삭제]   ← 기본(리스트 모드)
      │     [취소]  N개 선택  [🗑 삭제 (N)]     ← 선택 삭제 모드
      ├─ 리스트 뷰 (기본)
      │   ├─ 날짜별 그룹 (오늘/내일/어제 강조)
      │   ├─ 카드 왼쪽 색띠로 주인 구분 (🩷 수진/분홍 / 💙 종빈/하늘 / 💛 SJB/노랑)
      │   └─ 지난 일정 접기/펼치기
      ├─ 달력 뷰 (토글)
      │   ├─ ◀ ▶ 월 네비
      │   ├─ 7×6 날짜 그리드 — 셀에 owner 색 점 3개까지, 초과는 +N
      │   └─ 셀 탭 → 하단에 그 날의 일정 카드 리스트
      └─ ➕ FAB: 일정 추가 (제목 + 시작일 + 종료일(선택) + 시간/종일 + 주인 3택 + 메모)
```

---

## 주요 아키텍처 결정

### 서버 vs 클라이언트 경계
- `page.tsx` (서버): DB fetch → props로 내려줌
- `HomeView.tsx`(클라이언트): 탭/카테고리 상태 허브
- 도메인별 리스트(IngredientList, ShoppingList, ExpenseView)는 모두 클라이언트
- Server Action으로 쓰기 → `revalidatePath('/')` + `router.refresh()` 로 UI 동기화

### Optimistic UI 패턴
- 구매 체크 토글: 클릭 즉시 로컬 Map 업데이트 → 250ms 디바운스 후 서버 호출 → 실패 시 롤백
- 이유: Next.js 16 Turbopack에서 `revalidatePath` 단독으로 UI 반영이 종종 지연됨

### Soft Delete
- 재료: `consumed_at` (왜 사라졌는지 의미 부여)
- 구매/지출: `deleted_at`
- 쿼리는 `IS NULL` 필터

### 단위 시스템
- 구조화: 숫자 + 단위 (개/g/kg/ml/L) — QuantityInput 컴포넌트
- 자유 텍스트 fallback: "한 팩", "반 봉지" 등
- 소진 자동 차감: **같은 카테고리 내에서만** (무게·부피·개수 3분류)
- 카테고리 간 변환은 하지 않음 (kg↔L 같은 건 애매)

---

## 의사결정 로그

### 2026-04-22 (커플 일정 공유 추가)

- **4번째 탭 🗓️ 일정 추가**. 외부 캘린더 연동 대신 **자체 DB로 시작**. 이유: OAuth·키 관리·API 할당량 등 운영 부담을 피하고, 본 앱 사용자(커플) 니즈는 단순 — 개인 약속·기념일 기록·공유.
- **"주인" 라벨 3택**: 🩷 수진(pink) / 💙 종빈(sky) / 💛 SJB(yellow, 둘의 공유 일정). 로그인 없이 **라벨로만 구분**. 같은 URL을 둘이 공유해 쓰는 전제.
  - 수진=분홍, 종빈=하늘. 기념일 등 공유 일정은 **SJB=노랑**으로 눈에 띄게.
- **시간 입력 10분 단위**: `<input type="time" step={600}>`. 분 단위로 초세밀 조정은 오히려 입력 번거로움 → 10분 스냅.
  - ⚠️ 후속: `step` 속성이 브라우저 time 스피너 UI에 반영 안 됨(대부분 무시). → **시/분 드롭다운 2개**로 교체 (시 0~23, 분 00/10/20/30/40/50). 선택 자체가 10분 단위로 강제됨.
- **기간 일정**: `end_date date NULL` 컬럼 추가. "📆 기간 일정" 체크 시 종료일 나타나고 시간 필드 숨김(기간 일정은 종일로 강제). 종일+기간의 시간 범위(예: 3/1 14:00~3/3 10:00)는 범위 밖 — 필요해지면 end_time 컬럼 추가 예정.
- **시간 모델**: `event_date date NOT NULL` + `event_time time NULL`. `event_time IS NULL` = 종일. 기념일엔 시간이 어색하므로 "🌙 종일" 체크박스 제공.
- **반복 일정 비범위**: 매년 반복되는 기념일도 일단 수동 입력. 반복 규칙(RRULE)은 운영 난이도 대비 이득 적음. 불편해지면 추가.
- **뷰 형태**: **리스트 뷰를 기본**, 월간 달력은 "📅 달력으로 보기" 토글. 모바일에선 달력 셀이 좁아 평시엔 리스트가 낫고, 한 달 조망이 필요할 때만 달력 켜기.
  - 달력 뷰에서 셀이 좁아 텍스트 표시 불가 → **owner 색 점** 최대 3개로 압축 표기, 초과분은 `+N`. 셀 탭 → 하단에 그 날 일정 카드 리스트 상세.
- **카드 UI**: 왼쪽 세로 색띠(1.5px)로 주인 구분 + 오른쪽 상단 배지. 세로 띠만 있으면 색맹 사용자가 구분 어려울 수 있어 이모지 배지 중복 표기.
- **owner 라벨 변경**: "나/남친/둘 다" → **"수진/종빈/SJB"**. 본인들 이름과 커플 이니셜로 구체화 (추상 라벨보다 친근).
- **삭제 UX 변경**: 카드 개별 × 버튼을 **폐지**. 대신 상단 "🗑 선택 삭제" 진입 → 체크박스 모드로 **일괄 삭제**. 이유: 개별 × 버튼이 카드 영역을 좁히고, 커플 일정은 삭제 빈도 낮으니 상시 노출 불필요. 5초 실행취소 토스트로 실수 복구.
- **입력 박스 외형 통일**: 날짜/시작일/종료일/종일/기간 체크박스 전부 같은 `border+rounded-lg+px-3 py-3 text-base` 박스로 맞춤. 라벨 텍스트는 박스 내부 왼쪽.
- **입력창 placeholder 제거**: 제목 입력칸은 빈 상태가 깔끔. 기존 "(예: 200일 기념일)" 안내는 오히려 노이즈.
- **향후 4개 초과 메뉴 추가 시**: 🛒 구매 탭을 🥬 재료 탭 내부로 통합할 예정 (사용자 메모).

### Claude 운영 규칙 (AGENTS.md 반영)

- **SQL 실행**: `node scripts/run-sql.mjs <파일>` + `query.mjs`로 Claude가 `.env.local`의 `DATABASE_URL`을 통해 **직접 실행**. 이전까지 사용자에게 Supabase 대시보드 붙여넣기 요청했던 플로우를 제거. 계기: 테이블 안 만들어져서 `Could not find the table 'public.events'` 에러 발생 → 기존 스크립트 발견 → 플로우 개선.

### 2026-04-19 (앱 기본기 구축 — 초기 단일 날짜에 몰려있음)

- **스택 Python → Next.js 변경**: Netlify가 Python 서버를 제대로 지원 안 해서. Supabase가 백엔드 역할 다 해주므로 서버 레이어 없어도 됨.
- **레포 구조**: `C:\sj`는 워크스페이스, 각 프로젝트는 독립 레포.
- **Soft delete 방식**: `consumed_at` 선호 (vs `deleted_at`). "왜 사라졌는지" 의미가 더 명확.
- **구매 탭 삭제 UX**: `confirm()` 대화상자 → **× 버튼 즉시 삭제 + 5초 실행 취소 토스트** 로 전환. 모바일 친화적.
- **드래그앤드롭**: `@dnd-kit` 채택. 모바일 터치 딜레이(200ms) 설정.
- **가계부 카테고리**: 식자재 / 외식 / 배달 / 카페·간식 4개로 시작 → **음주** 추가하여 5개. 이유: 술값이 식비에서 차지하는 비중 별도 추적 필요.
- **구매처(place) 컬럼**: 가계부 식자재 카테고리에서만 노출. 마트/편의점/시장/기타(자유텍스트). 이유: 영수증 기반 회고 시 유용.

### 2026-04-19 (UX·아키텍처 정리)

- **MVP 리팩토링 (폴더 이동 없이)**:
  - `actions.ts` (326줄) → `actions/{ingredients,shopping,expenses}.ts` 도메인별 분리
  - Edit 다이얼로그 3개를 각 리스트 파일에서 독립 파일로 추출
  - 공용 `Modal.tsx` 쉘 생성 (이전엔 각 다이얼로그가 백드롭/스크롤잠금 중복 구현)
  - `lib/utils/` 로 순수 함수 추출 (date, currency, month, quantity, voice-parser)
  - **이유**: 파일 50+개 되면 폴더 구조 이동, 그 전까진 평면 유지가 탐색 빠름
- **전역 상태 라이브러리(Zustand 등) 도입 안 함**: URL + Server Component + useState 조합으로 충분한 스케일
- **에러 핸들링 표준화**: 모든 서버 액션이 DB 에러에 throw → 클라이언트에서 빨간 박스로 표시. 이전엔 조용히 실패.
- **체크 토글 비동기화**: `<form action>` 대신 버튼 onClick + optimistic state + 디바운스 250ms + fire-and-forget. 연속 클릭 안정화.
- **구매 항목 자동 숨김**: 체크된 지 24시간 지나면 쿼리에서 제외. DB는 유지 (회고용).
- **로고 클릭 → 전체 재료 보기**: 헤더를 `page.tsx`(서버)에서 `HomeView`(클라이언트)로 이동하여 상태 공유 가능.
- **폰트 변경**: 시스템 기본(Arial) → Gowun Dodum → **Jua (주아체)**. 귀여움 우선.
- **로고 이미지 처리**: Gemini가 생성한 SJB 모노그램을 sharp 라이브러리로 자동 크롭 + 회색 배경 → 투명 알파 변환.
- **메모 입력란 자동 확장**: `<textarea>` → `AutoResizeTextarea` 공용 컴포넌트로 일괄 교체. `useLayoutEffect` + `scrollHeight` 측정으로 구현, 라이브러리 미사용. 수정 다이얼로그 열릴 때도 기존 내용 길이 반영. 이유: 모바일에서 긴 메모 스크롤 보기 불편하다는 피드백.

---

## 명시적 비범위 (안 할 것)

- 로그인/인증 — 현재 URL 공유 + 라벨(me/partner/both)만으로 2인 운영
- 재료 바코드 스캔
- 레시피 추천 알고리즘 (ChatGPT 링크로 대체)
- 외부 캘린더(Google/Naver) 연동
- 일정 반복(RRULE)
- Repository/DTO 레이어 추가 (현재 스케일에 오버엔지니어링)
