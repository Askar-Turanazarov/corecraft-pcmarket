import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { db } from '@/lib/db'
import { requireAdmin, ui } from '../admin'

export default async function AdminGames({ params }: { params: Promise<{ adminPath: string }> }) {
  const { base } = await requireAdmin((await params).adminPath)
  // Игр десятки, не тысячи — пагинация не нужна.
  const games = await db.game.findMany({ orderBy: [{ year: 'desc' }, { titleEn: 'asc' }] })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Игры <span className="text-base text-muted">({games.length})</span></h1>
        <Link href={`${base}/games/new`} className={ui.button}>Добавить игру</Link>
      </div>
      <table className={ui.table}>
        <thead>
          <tr><th>Название</th><th>Год</th><th>Low / Med / High / Ultra</th><th>CPU</th><th>RT</th><th>Активна</th></tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <tr key={g.id} className={cn(!g.isActive && 'text-muted')}>
              <td><Link href={`${base}/games/${g.id}`} className={ui.link}>{g.titleRu}</Link></td>
              <td>{g.year}</td>
              <td>{g.demandLow} / {g.demandMedium} / {g.demandHigh} / {g.demandUltra}</td>
              <td>{g.cpuDemand}</td>
              <td>{g.supportsRt ? `×${g.rtCost}` : '—'}</td>
              <td>{g.isActive ? 'да' : 'нет'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
