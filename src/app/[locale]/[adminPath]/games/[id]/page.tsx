import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { saveGame } from '../../actions'
import { cn } from '@/lib/cn'
import { button, field, panel, sectionTitle } from '@/components/ui/styles'
import { GAME_NUMBERS, one, requireAdmin } from '../../admin'
import { ErrorNote, check, checkbox, label, title } from '../../admin-ui'

// Этот же маршрут обслуживает /games/new: cuid никогда не равен "new",
// а отдельная страница создания дублировала бы всю форму.
export default async function AdminGameEdit({
  params,
  searchParams,
}: {
  params: Promise<{ adminPath: string; id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { adminPath, id } = await params
  await requireAdmin(adminPath)
  const error = one((await searchParams).error)

  const isNew = id === 'new'
  const g = isNew ? null : await db.game.findUnique({ where: { id } })
  if (!isNew && !g) notFound()

  const text = (['slug', 'titleRu', 'titleUz', 'titleEn', 'engine', 'genre', 'coverUrl'] as const).map(
    (k) => [k, g?.[k] ?? ''] as const,
  )
  // Для новой игры — разумные стартовые значения, чтобы форма сразу проходила проверку.
  const defaults: Record<string, number> = {
    demandLow: 1, demandMedium: 1.5, demandHigh: 2, demandUltra: 2.6, cpuDemand: 1,
    vramLow: 4, vramMedium: 6, vramHigh: 8, vramUltra: 10, rtCost: 1.6,
  }

  return (
    <form action={saveGame} className="max-w-5xl space-y-6">
      {g && <input type="hidden" name="id" value={g.id} />}
      <h1 className={title}>{g ? g.titleRu : 'Новая игра'}</h1>
      {error && <ErrorNote>{error}</ErrorNote>}

      <section className={cn(panel, 'grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4')}>
        <h2 className={cn(sectionTitle, 'sm:col-span-2 lg:col-span-4')}>Описание</h2>
        {text.map(([name, value]) => (
          <label key={name} className={label}>
            {name}
            <input name={name} defaultValue={value} required={!['engine', 'genre', 'coverUrl'].includes(name)} className={field} />
          </label>
        ))}
        <label className={label}>
          year
          <input name="year" type="number" defaultValue={g?.year ?? new Date().getFullYear()} required className={cn(field, 'tabular')} />
        </label>
      </section>

      <section className={cn(panel, 'grid gap-4 p-5 sm:grid-cols-3 sm:p-6 lg:grid-cols-5')}>
        <div className="sm:col-span-3 lg:col-span-5">
          <h2 className={sectionTitle}>Коэффициенты</h2>
          <p className="mt-1 text-sm text-muted">
            Все &gt; 0; demandLow &lt; demandMedium &lt; demandHigh &lt; demandUltra; vram — ГБ.
          </p>
        </div>
        {GAME_NUMBERS.map((name) => (
          <label key={name} className={label}>
            {name}
            <input name={name} type="number" step="any" min={0} defaultValue={g?.[name] ?? defaults[name]} required className={cn(field, 'tabular')} />
          </label>
        ))}
      </section>

      <fieldset className={cn(panel, 'flex flex-wrap gap-x-8 p-5 sm:p-6')}>
        <legend className="sr-only">Флаги</legend>
        <label className={check}><input name="supportsRt" type="checkbox" defaultChecked={g?.supportsRt ?? false} className={checkbox} /> Трассировка лучей</label>
        <label className={check}><input name="supportsUpscaling" type="checkbox" defaultChecked={g?.supportsUpscaling ?? true} className={checkbox} /> Апскейлинг</label>
        <label className={check}><input name="isActive" type="checkbox" defaultChecked={g?.isActive ?? true} className={checkbox} /> Активна</label>
      </fieldset>

      <button className={button('primary', 'lg')}>{g ? 'Сохранить' : 'Создать'}</button>
    </form>
  )
}
