import { db } from '@/lib/db'
import { toggleRole } from '../actions'
import { date, one, requireAdmin, ui } from '../admin'

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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Пользователи</h1>
      {error && <p className="rounded-md border border-danger px-3 py-2 text-sm text-danger">{error}</p>}
      <table className={ui.table}>
        <thead>
          <tr><th>Email</th><th>Telegram ID</th><th>Имя</th><th>Роль</th><th>Создан</th><th /></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email ?? '—'}</td>
              <td>{u.telegramId ?? '—'}</td>
              <td>{u.name ?? '—'}</td>
              <td className={u.role === 'ADMIN' ? 'text-accent' : undefined}>{u.role}</td>
              <td className="whitespace-nowrap">{date(u.createdAt)}</td>
              <td>
                {/* Себя не понижаем: кнопки нет, а action проверяет это ещё раз. */}
                {u.id !== userId && (
                  <form action={toggleRole}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className="text-xs text-accent hover:underline">
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
  )
}
