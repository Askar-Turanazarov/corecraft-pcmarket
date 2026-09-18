import { db } from '@/lib/db'
import { DEFAULT_USD_RATE } from '@/lib/money'
import { saveSettings } from '../actions'
import { one, requireAdmin, ui } from '../admin'

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
    <form action={saveSettings} className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Настройки</h1>
      {error && <p className="whitespace-pre-line rounded-md border border-danger px-3 py-2 text-sm text-danger">{error}</p>}
      {FIELDS.map(([key, label, fallback]) => (
        <label key={key} className={ui.label}>
          {label}
          <input
            name={key}
            type="number"
            step="any"
            min={0}
            required
            defaultValue={rows.find((r) => r.key === key)?.value ?? fallback}
            className={ui.input}
          />
        </label>
      ))}
      <button className={ui.button}>Сохранить</button>
    </form>
  )
}
