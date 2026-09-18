'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { button } from '@/components/ui/styles'

/** Копирует строку конфигурации — её удобно отправить в чат или вставить в заказ. */
export function CopyButton({ text, labels }: { text: string; labels: { copy: string; copied: string } }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      disabled={!text}
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setDone(true)
        setTimeout(() => setDone(false), 1800)
      }}
      className={button('secondary', 'sm')}
    >
      {done ? <Check className="size-4 text-plasma" /> : <Copy className="size-4" />}
      <span aria-live="polite">{done ? labels.copied : labels.copy}</span>
    </button>
  )
}
