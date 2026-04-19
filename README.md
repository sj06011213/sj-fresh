# 수진프레시 🥬

냉장고 재료 + 장보기 + 식비 가계부를 한 앱에서. 모바일 퍼스트.

## 주요 기능

### 🥬 재료 관리
- 냉장 / 냉동 / 팬트리 분류 + "전체" 보기 (로고 클릭)
- 유통기한 임박 자동 정렬 (D-day 뱃지)
- 숫자 + 단위 구조화 입력 (개 / g / kg / ml / L / 기타)
- 드래그앤드롭 "내 순서" 정렬 (편집 모드 토글)
- 소진 기록 시 **단위 자동 환산 차감** (L ↔ ml, kg ↔ g)
- ChatGPT 레시피 추천 링크

### 🛒 구매 필요
- 🎤 **음성 입력 연속 모드** — "우유 두 개" 자연어 파싱 후 자동 추가
- × 즉시 삭제 + 5초 실행 취소
- 장봤음 체크 24시간 후 자동 숨김

### 💰 식비 가계부
- 월 이동 (◀ ▶) + 카테고리 비율 바
- 5개 카테고리: 식자재 / 외식 / 배달 / 음주 / 카페·간식
- 구매처 선택 (식자재에서만): 마트 / 편의점 / 시장 / 기타
- 날짜별 그룹 목록 (오늘·어제 강조)

### 공통
- Soft delete — 모든 이력 보존 (DB에서 실제 삭제 X)
- Optimistic UI — 네트워크 지연에 UI 끌려가지 않음
- 다크모드 자동 대응
- 모달 Esc 키 닫기, 에러 발생 시 빨간 박스 표시

## 기술 스택

- **Next.js 16** (App Router, Turbopack) + TypeScript + Tailwind CSS v4
- **Supabase** (PostgreSQL + Auth + Storage)
- **Jua (주아체)** 한국어 폰트 (Google Fonts)
- **@dnd-kit** — 드래그앤드롭 정렬
- **sharp** — 이미지 자동 처리
- **Netlify** — GitHub `main` push 시 자동 배포

## 실행 방법

```bash
npm install
cp .env.example .env.local  # Supabase 키 채우기
npm run dev
```

개발 서버: http://localhost:3000

## DB 셋업

Supabase SQL Editor에서 `scripts/sql/` 폴더의 마이그레이션을 순서대로 실행:
```
001_init.sql → 002_add_quantity.sql → ... → 012_add_expense_alcohol_category.sql
```

자세한 스키마는 [docs/schema.md](docs/schema.md) 참고.

## 배포

`main` 브랜치에 push → Netlify 자동 빌드·배포.

## 문서

- 📋 [요구사항 — 완성/미완성 기능 리스트](docs/requirements.md)
- 📐 [기획 — 아키텍처·의사결정 로그](docs/planning.md)
- 🗄 [DB 스키마 — 테이블/마이그레이션](docs/schema.md)
