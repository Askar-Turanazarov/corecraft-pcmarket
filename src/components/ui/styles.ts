import { cn } from '@/lib/cn'

// Классы кита — функциями, а не компонентами: одна кнопка бывает <button>, <Link> и submit в форме.

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-strong',
  secondary: 'border border-border bg-surface-2 text-foreground hover:border-accent/60',
  ghost: 'text-muted hover:bg-surface-2 hover:text-foreground',
  danger: 'border border-danger/40 text-danger hover:bg-danger/10',
}

const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-[15px]',
  lg: 'min-h-12 px-6 text-base',
}

export function button(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium',
    'transition-colors duration-200 ease-[var(--ease-out-soft)] disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}

type Tone = 'neutral' | 'accent' | 'plasma' | 'warning' | 'danger'

const TONES: Record<Tone, string> = {
  neutral: 'text-muted border-border',
  accent: 'text-accent border-accent/40',
  plasma: 'text-plasma border-plasma/40',
  warning: 'text-warning border-warning/40',
  danger: 'text-danger border-danger/40',
}

export function badge(tone: Tone = 'neutral', className?: string) {
  return cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', TONES[tone], className)
}

/** Поле ввода, select и textarea — один вид. */
export const field =
  'w-full min-h-11 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 py-2 text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent'

/** Карточка товара и небольшие блоки. */
export const card = 'rounded-[var(--radius-card)] border border-border bg-surface'

/** Крупные панели: конструктор, итоги, формы. */
export const panel = 'rounded-[var(--radius-panel)] border border-border bg-surface'

/** Заголовок страницы. */
export const pageTitle = 'font-display text-3xl font-semibold tracking-tight sm:text-4xl'

/** Заголовок раздела на странице. */
export const sectionTitle = 'font-display text-xl font-semibold tracking-tight sm:text-2xl'
