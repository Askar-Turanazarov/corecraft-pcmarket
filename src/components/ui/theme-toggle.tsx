'use client'

import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'

// Тема в cookie: сервер сразу рисует нужную (без вспышки), а переключение — мгновенное, без перезагрузки.
export function ThemeToggle({ initial, labels }: { initial: 'dark' | 'light'; labels: { dark: string; light: string } }) {
  const [theme, setTheme] = useState(initial)
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      aria-label={labels[next]}
      title={labels[next]}
      onClick={() => {
        document.documentElement.dataset.theme = next
        document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`
        setTheme(next)
      }}
      className="grid size-10 cursor-pointer place-items-center rounded-[var(--radius-control)] text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}
