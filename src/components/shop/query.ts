export type Query = Record<string, string | undefined>

const KEYS = ['q', 'category', 'brand', 'minPrice', 'maxPrice', 'sort', 'page'] as const

/** Оставляем только известные параметры и схлопываем повторы вида ?a=1&a=2. */
export function readQuery(
  raw: Record<string, string | string[] | undefined>,
): Query {
  const query: Query = {}
  for (const key of KEYS) {
    const value = raw[key]
    const single = Array.isArray(value) ? value[0] : value
    if (single) query[key] = single
  }
  return query
}

/** Адрес каталога с изменёнными параметрами. Смена фильтра сбрасывает страницу. */
export function catalogHref(query: Query, patch: Query): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...query, page: undefined, ...patch })) {
    if (value) params.set(key, value)
  }
  const search = params.toString()
  return search ? `/catalog?${search}` : '/catalog'
}
