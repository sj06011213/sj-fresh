'use server'

import { revalidatePath } from 'next/cache'
import { supabase, type EventOwner } from '@/lib/supabase'

function assertOk(error: { message: string } | null, verb: string): void {
  if (error) throw new Error(`${verb} 실패: ${error.message}`)
}

function parseOwner(raw: unknown): EventOwner {
  const v = String(raw ?? '')
  if (v === 'me' || v === 'partner' || v === 'both') return v
  throw new Error('일정 주인 값이 올바르지 않아요.')
}

function buildEventPayload(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const event_date = String(formData.get('event_date') ?? '').trim()
  const timeRaw = String(formData.get('event_time') ?? '').trim()
  const allDay = formData.get('all_day') === 'true'
  const multiDay = formData.get('multi_day') === 'true'
  const endDateRaw = String(formData.get('end_date') ?? '').trim()
  const owner = parseOwner(formData.get('owner'))
  const memo = String(formData.get('memo') ?? '').trim()

  if (!title) throw new Error('일정 제목을 입력해주세요.')
  if (!event_date) throw new Error('시작 날짜를 선택해주세요.')

  let end_date: string | null = null
  let event_time: string | null = null

  if (multiDay) {
    // 기간 일정: 종료일 필수, 시간은 무시(종일 강제)
    if (!endDateRaw) throw new Error('종료 날짜를 선택해주세요.')
    if (endDateRaw < event_date) {
      throw new Error('종료 날짜는 시작 날짜보다 빠를 수 없어요.')
    }
    end_date = endDateRaw === event_date ? null : endDateRaw
    event_time = null
  } else {
    if (!allDay && !timeRaw) {
      throw new Error('시간을 입력하거나 종일을 선택해주세요.')
    }
    event_time = allDay ? null : timeRaw
  }

  return {
    title,
    event_date,
    event_time,
    end_date,
    owner,
    memo: memo || null,
  }
}

export async function addEvent(formData: FormData) {
  const payload = buildEventPayload(formData)
  const { error } = await supabase.from('events').insert(payload)
  assertOk(error, '일정 추가')
  revalidatePath('/')
}

export async function updateEvent(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) throw new Error('일정 id가 없어요.')
  const payload = buildEventPayload(formData)
  const { error } = await supabase.from('events').update(payload).eq('id', id)
  assertOk(error, '일정 수정')
  revalidatePath('/')
}

export async function deleteEvent(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const { error } = await supabase
    .from('events')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  assertOk(error, '일정 삭제')
  revalidatePath('/')
}

export async function restoreEvent(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const { error } = await supabase
    .from('events')
    .update({ deleted_at: null })
    .eq('id', id)
  assertOk(error, '일정 복구')
  revalidatePath('/')
}
