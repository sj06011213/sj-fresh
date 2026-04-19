#!/usr/bin/env node
// Supabase DB에 SQL 파일 실행하는 유틸
// 사용법: node scripts/run-sql.mjs <sql 파일 경로>
// 예:    node scripts/run-sql.mjs scripts/sql/001_init.sql

import { readFileSync } from 'node:fs'
import pg from 'pg'
import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd())

const sqlFile = process.argv[2]
if (!sqlFile) {
  console.error('사용법: node scripts/run-sql.mjs <sql 파일 경로>')
  process.exit(1)
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL 환경변수가 없어요. .env.local 확인하세요.')
  process.exit(1)
}

const sql = readFileSync(sqlFile, 'utf8')
console.log(`📄 SQL 파일: ${sqlFile}`)
console.log(`🔌 DB 연결 중...`)

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log('✅ 연결 성공')
  console.log('⚙️  SQL 실행 중...')
  await client.query(sql)
  console.log('✅ 실행 완료')
} catch (err) {
  console.error('❌ 오류:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
