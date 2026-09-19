import { db } from '@/lib/db'
import { toggleRole } from '../actions'
import { badge, button } from '@/components/ui/styles'
import { date, one, requireAdmin } from '../admin'
import { ErrorNote, table, tableWrap, title } from '../admin-ui'

export default async function AdminUsers({
  params,
  searchParams,
}: {
  params: Promise<{ adminPath: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { userId } = await requireAdmin((await params).adminPath)
  const error = one((await searchParams).error)
  // ponytail: без пагинации, последние 500. Потолок — тысячи покупателей, тогда нужен поиск.
  const users = await db.user.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })

  return (
    <div className="space-y-6">
      <h1 className={title}>Пользователи</h1>
      {error && <ErrorNote>{error}</ErrorNote>}
      <div className={tableWrap}>
        <table className={table}>
          <thead>
            <tr><th>Email</th><th>Telegram ID</th><th>Имя</th><th>Роль</th><th>Создан</th><th><span className="sr-only">Действия</span></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="break-all">{u.email ?? '—'}</td>
                <td className="tabular">{u.telegramId ?? '—'}</td>
                <td>{u.name ?? '—'}</td>
                <td><span className={badge(u.role === 'ADMIN' ? 'accent' : 'neutral')}>{u.role}</span></td>
                <td className="tabular whitespace-nowrap">{date(u.createdAt)}</td>
                <td className="text-right">
                  {/* Себя не понижаем: кнопки нет, а action проверяет это ещё раз. */}
                  {u.id !== userId && (
                    <form action={toggleRole}>
                      <input type="hidden" name="id" value={u.id} />
                      <button className={button('secondary', 'md', 'whitespace-nowrap text-sm')}>
                        {u.role === 'ADMIN' ? 'Сделать USER' : 'Сделать ADMIN'}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
