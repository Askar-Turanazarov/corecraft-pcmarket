import { db } from '@/lib/db'
import { DEFAULT_USD_RATE } from '@/lib/money'
import { saveSettings } from '../actions'
import { cn } from '@/lib/cn'
import { button, field, panel } from '@/components/ui/styles'
import { one, requireAdmin } from '../admin'
import { ErrorNote, label, title } from '../admin-ui'

// Значения по умолчанию совпадают с фолбэками в src/lib/settings.ts.
const FIELDS = [
  ['usdRate', 'Курс доллара, сум за $1', DEFAULT_USD_RATE],
  ['fpsGpuConstant', 'Константа модели FPS — видеокарта (K)', 60],
  ['fpsCpuConstant', 'Константа модели FPS — процессор (C)', 60],
] as const

export default async function AdminSettings({
  params,
  searchParams,
}: {
  params: Promise<{ adminPath: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin((await params).adminPath)
  const error = one((await searchParams).error)
  const rows = await db.setting.findMany({ where: { key: { in: FIELDS.map(([k]) => k) } } })

  return (
    <form action={saveSettings} className="max-w-lg space-y-6">
      <h1 className={title}>Настройки</h1>
      {error && <ErrorNote>{error}</ErrorNote>}
      <div className={cn(panel, 'space-y-4 p-5 sm:p-6')}>
        {FIELDS.map(([key, text, fallback]) => (
          <label key={key} className={label}>
            {text}
            <input
              name={key}
              type="number"
              step="any"
              min={0}
              required
              defaultValue={rows.find((r) => r.key === key)?.value ?? fallback}
              className={cn(field, 'tabular')}
            />
          </label>
        ))}
      </div>
      <button className={button('primary', 'lg')}>Сохранить</button>
    </form>
  )
}
