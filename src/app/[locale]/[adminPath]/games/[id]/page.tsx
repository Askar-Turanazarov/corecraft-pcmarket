import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { saveGame } from '../../actions'
import { GAME_NUMBERS, one, requireAdmin, ui } from '../../admin'

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
    <form action={saveGame} className="space-y-6">
      {g && <input type="hidden" name="id" value={g.id} />}
      <h1 className="text-2xl font-semibold">{g ? g.titleRu : 'Новая игра'}</h1>
      {error && <p className="whitespace-pre-line rounded-md border border-danger px-3 py-2 text-sm text-danger">{error}</p>}

      <section className={`${ui.card} grid gap-3 sm:grid-cols-4`}>
        {text.map(([name, value]) => (
          <label key={name} className={ui.label}>
            {name}
            <input name={name} defaultValue={value} required={!['engine', 'genre', 'coverUrl'].includes(name)} className={ui.input} />
          </label>
        ))}
        <label className={ui.label}>
          year
          <input name="year" type="number" defaultValue={g?.year ?? new Date().getFullYear()} required className={ui.input} />
        </label>
      </section>

      <section className={`${ui.card} grid gap-3 sm:grid-cols-5`}>
        <h2 className="font-medium sm:col-span-5">
          Коэффициенты (все &gt; 0; demandLow &lt; demandMedium &lt; demandHigh &lt; demandUltra; vram — ГБ)
        </h2>
        {GAME_NUMBERS.map((name) => (
          <label key={name} className={ui.label}>
            {name}
            <input name={name} type="number" step="any" min={0} defaultValue={g?.[name] ?? defaults[name]} required className={ui.input} />
          </label>
        ))}
      </section>

      <section className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input name="supportsRt" type="checkbox" defaultChecked={g?.supportsRt ?? false} /> Трассировка лучей</label>
        <label className="flex items-center gap-2"><input name="supportsUpscaling" type="checkbox" defaultChecked={g?.supportsUpscaling ?? true} /> Апскейлинг</label>
        <label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked={g?.isActive ?? true} /> Активна</label>
      </section>

      <button className={ui.button}>{g ? 'Сохранить' : 'Создать'}</button>
    </form>
  )
}
