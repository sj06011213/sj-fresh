# sj-fresh 🥬

냉장고 재료 관리 웹앱. 넣은 재료, 유통기한, 소비 이력을 한 곳에서 관리.

## 특징
- 📱 모바일 퍼스트 웹 (폰에서도 쾌적)
- ⏰ 유통기한 임박 재료 자동 정렬 (D-day 뱃지)
- 🗂️ Soft delete — 소비 이력이 그대로 남음
- 🔒 Supabase로 DB/인증/저장소 통합

## 기술 스택
- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Supabase (PostgreSQL)
- Netlify (자동 배포)

## 실행 방법

```bash
npm install
cp .env.example .env.local  # 그리고 Supabase 키 채우기
npm run dev
```

개발 서버: http://localhost:3000

## 배포
`main` 브랜치에 push하면 Netlify가 자동 빌드·배포.

## 문서
- [요구사항](docs/requirements.md)
- [기획](docs/planning.md)
- [DB 스키마](docs/schema.md)
