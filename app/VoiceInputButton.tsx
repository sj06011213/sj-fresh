'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

interface SpeechRecognitionAlternativeLike {
  transcript: string
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike
  isFinal: boolean
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionErrorEventLike {
  error: string
}
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const win = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null
}

function subscribeNoop() {
  return () => {}
}
function getSupportedSnapshot() {
  return getSpeechRecognitionCtor() !== null
}
function getSupportedServerSnapshot() {
  return false
}

export default function VoiceInputButton({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string) => void
  disabled?: boolean
}) {
  const supported = useSyncExternalStore(
    subscribeNoop,
    getSupportedSnapshot,
    getSupportedServerSnapshot,
  )
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    const SR = getSpeechRecognitionCtor()
    if (!SR) return
    const rec = new SR()
    rec.lang = 'ko-KR'
    rec.interimResults = false
    rec.continuous = true
    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (!result?.isFinal) continue
        const text = result[0]?.transcript?.trim() ?? ''
        if (text) onTranscriptRef.current(text)
      }
    }
    rec.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      setListening(false)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        alert('🎤 마이크 권한이 거부됐어요. 브라우저 주소창의 자물쇠 아이콘에서 마이크를 허용해주세요.')
      }
    }
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    return () => {
      try {
        rec.stop()
      } catch {
        // ignore
      }
    }
  }, [])

  if (!supported) return null

  function toggle() {
    const rec = recognitionRef.current
    if (!rec) return
    if (listening) {
      rec.stop()
      setListening(false)
      return
    }
    try {
      rec.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={listening ? '음성 입력 중지' : '음성으로 입력'}
      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-xl transition disabled:opacity-50 ${
        listening
          ? 'animate-pulse bg-rose-500 text-white hover:bg-rose-600'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
      }`}
    >
      {listening ? '⏹' : '🎤'}
    </button>
  )
}
