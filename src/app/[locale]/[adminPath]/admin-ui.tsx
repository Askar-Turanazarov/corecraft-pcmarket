import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { badge, card } from '@/components/ui/styles'

// Вид панели поверх кита. Классы `ui` из admin.ts больше не используются — admin.ts не трогаем.

export const title = 'font-display text-2xl font-semibold tracking-tight'

/** Обёртка таблицы: карточка с горизонтальной прокруткой на узких экранах. */
export const tableWrap = cn(card, 'relative overflow-x-auto')

export const table = cn(
  'w-full text-sm',
  '[&_th]:whitespace-nowrap [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted',
  '[&_td]:border-t [&_td]:border-border [&_td]:px-4 [&_td]:py-2 [&_td]:align-middle',
  '[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-surface-2',
)

/** Ссылка-действие в строке таблицы: цель касания 44 px. */
export const rowLink = 'inline-flex min-h-11 items-center font-medium text-accent hover:text-accent-strong hover:underline'

export const label = 'flex flex-col gap-1.5 text-sm text-muted'

export const check = 'flex min-h-11 cursor-pointer items-center gap-3 text-sm'
export const checkbox = 'size-4 accent-accent'

export const STATUS_TONE: Record<string, Parameters<typeof badge>[0]> = {
  PENDING: 'warning',
  PAID: 'plasma',
  SHIPPED: 'accent',
  DONE: 'neutral',
  CANCELLED: 'danger',
}

export function Status({ value }: { value: string }) {
  return <span className={badge(STATUS_TONE[value] ?? 'neutral')}>{value}</span>
}

export function ErrorNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      role="alert"
      className={cn('flex gap-2 whitespace-pre-line rounded-[var(--radius-card)] border border-danger/40 bg-danger/10 p-4 text-sm', className)}
    >
      <AlertTriangle className="size-5 shrink-0 text-danger" aria-hidden />
      <span>{children}</span>
    </p>
  )
}
