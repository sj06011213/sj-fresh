'use client'

import { useLayoutEffect, useRef, type ComponentProps } from 'react'

/**
 * Textarea that grows with content — no scrollbar needed.
 *
 * Drop-in replacement for <textarea>. Preserves `rows` as initial height.
 * Uses the classic "reset to auto, then measure scrollHeight" trick, run on
 * every render so external value/defaultValue changes resize correctly.
 */
export default function AutoResizeTextarea({
  onInput,
  className,
  ...props
}: ComponentProps<'textarea'>) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  })

  return (
    <textarea
      ref={ref}
      {...props}
      onInput={(e) => {
        const el = e.currentTarget
        el.style.height = 'auto'
        el.style.height = `${el.scrollHeight}px`
        onInput?.(e)
      }}
      className={`resize-none overflow-hidden ${className ?? ''}`}
    />
  )
}
