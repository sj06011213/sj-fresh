#!/usr/bin/env node
// 빠른 SELECT 확인용 유틸 (결과를 테이블로 출력)
// 사용법: node scripts/query.mjs "SELECT * FROM ingredients LIMIT 5"

import pg from 'pg'
import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd())

const sql = process.argv[2]
if (!sql) {
  console.error('사용법: node scripts/query.mjs "<SQL>"')
  process.exit(1)
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  const result = await client.query(sql)
  if (result.rows.length === 0) {
    console.log('(0 rows)')
  } else {
    console.table(result.rows)
  }
  console.log(`\n${result.rowCount ?? result.rows.length} row(s)`)
} catch (err) {
  console.error('❌ 오류:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
