import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { db } from '@/lib/db'
import { badge, button } from '@/components/ui/styles'
import { requireAdmin } from '../admin'
import { rowLink, table, tableWrap, title } from '../admin-ui'

export default async function AdminGames({ params }: { params: Promise<{ adminPath: string }> }) {
  const { base } = await requireAdmin((await params).adminPath)
  // Игр десятки, не тысячи — пагинация не нужна.
  const games = await db.game.findMany({ orderBy: [{ year: 'desc' }, { titleEn: 'asc' }] })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={title}>
          Игры <span className="tabular text-base font-normal text-muted">({games.length})</span>
        </h1>
        <Link href={`${base}/games/new`} className={button('primary', 'md')}>Добавить игру</Link>
      </div>
      <div className={tableWrap}>
        <table className={table}>
          <thead>
            <tr><th>Название</th><th>Год</th><th>Low / Med / High / Ultra</th><th>CPU</th><th>RT</th><th>Статус</th></tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.id} className={cn(!g.isActive && 'text-muted')}>
                <td className="min-w-48"><Link href={`${base}/games/${g.id}`} className={rowLink}>{g.titleRu}</Link></td>
                <td className="tabular">{g.year}</td>
                <td className="tabular whitespace-nowrap">{g.demandLow} / {g.demandMedium} / {g.demandHigh} / {g.demandUltra}</td>
                <td className="tabular">{g.cpuDemand}</td>
                <td className="tabular">{g.supportsRt ? `×${g.rtCost}` : '—'}</td>
                <td>
                  <span className={badge(g.isActive ? 'plasma' : 'neutral')}>{g.isActive ? 'Активна' : 'Скрыта'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
