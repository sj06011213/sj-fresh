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
│       └── expenses.ts       # 지출 서버 액션
│
├── lib/
│   ├── supabase.ts           # Supabase 클라이언트 + 타입 정의
│   └── utils/
│       ├── date.ts           # today(), formatDateLabel()
│       ├── currency.ts       # formatKRW()
│       ├── month.ts          # toMonthKey(), shiftMonth(), monthLabel()
│       ├── quantity.ts       # 단위 파싱·변환·포맷 (L↔ml, kg↔g)
│       └── voice-parser.ts   # parseShoppingText() — 음성 자연어 → 이름+양
│
├── scripts/sql/              # DB 마이그레이션 (001~012)
├── public/                   # 정적 에셋 (로고 등)
└── docs/                     # 문서
```

---

## 화면 흐름

```
메인 페이지
  ├─ 헤더: SJB 로고 (클릭 → 재료 탭 전체 보기로 이동)
  ├─ 탭: 🥬 재료 / 🛒 구매 / 💰 가계부
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
  └─ 💰 가계부 탭
      ├─ 월 네비 (◀ ▶) + 이번 달 합계
      ├─ 카테고리 비율 바 (5개 카테고리)
      ├─ 날짜별 그룹 목록
      └─ ➕ FAB: 지출 기록 (식자재 선택 시 구매처 입력 노출)
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

- 다중 사용자·가족 공유 (1인 사용 기준)
- 재료 바코드 스캔
- 레시피 추천 알고리즘 (ChatGPT 링크로 대체)
- Repository/DTO 레이어 추가 (현재 스케일에 오버엔지니어링)
