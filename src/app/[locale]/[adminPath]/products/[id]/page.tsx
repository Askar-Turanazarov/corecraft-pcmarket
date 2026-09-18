import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { saveProduct } from '../../actions'
import { PRODUCT_FLOAT, PRODUCT_INT, PRODUCT_JSON, PRODUCT_STR, one, requireAdmin, ui } from '../../admin'

export default async function AdminProductEdit({
  params,
  searchParams,
}: {
  params: Promise<{ adminPath: string; id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { adminPath, id } = await params
  await requireAdmin(adminPath)
  const error = one((await searchParams).error)

  const p = await db.product.findUnique({ where: { id } })
  if (!p) notFound()

  // Поля движков — все nullable: пустое поле сохраняется как null.
  const engine: [string, string | number | null, string][] = [
    ...PRODUCT_STR.map((k): [string, string | null, string] => [k, p[k], 'text']),
    ...PRODUCT_INT.map((k): [string, number | null, string] => [k, p[k], 'number']),
    ...PRODUCT_FLOAT.map((k): [string, number | null, string] => [k, p[k], 'number']),
    ...PRODUCT_JSON.map((k): [string, string | null, string] => [k, p[k], 'text']),
  ]

  return (
    <form action={saveProduct} className="space-y-6">
      <input type="hidden" name="id" value={p.id} />
      <div>
        <h1 className="text-2xl font-semibold">{p.nameRu}</h1>
        <p className="text-sm text-muted">{p.slug} · {p.category} · {p.brand} {p.model}</p>
      </div>
      {error && <p className="whitespace-pre-line rounded-md border border-danger px-3 py-2 text-sm text-danger">{error}</p>}

      <section className={`${ui.card} grid gap-3 sm:grid-cols-3`}>
        <label className={ui.label}>nameRu<input name="nameRu" defaultValue={p.nameRu} required className={ui.input} /></label>
        <label className={ui.label}>nameUz<input name="nameUz" defaultValue={p.nameUz} required className={ui.input} /></label>
        <label className={ui.label}>nameEn<input name="nameEn" defaultValue={p.nameEn} required className={ui.input} /></label>
        <label className={ui.label}>priceUzs<input name="priceUzs" type="number" min={0} defaultValue={p.priceUzs} required className={ui.input} /></label>
        <label className={ui.label}>oldPriceUzs<input name="oldPriceUzs" type="number" min={0} defaultValue={p.oldPriceUzs ?? ''} className={ui.input} /></label>
        <label className={ui.label}>stock<input name="stock" type="number" min={0} defaultValue={p.stock} required className={ui.input} /></label>
        <label className="flex items-center gap-2 text-sm">
          <input name="isActive" type="checkbox" defaultChecked={p.isActive} /> Активен (виден в каталоге)
        </label>
      </section>

      <section className={`${ui.card} grid gap-3 sm:grid-cols-4`}>
        <h2 className="font-medium sm:col-span-4">Поля движков совместимости и FPS</h2>
        {engine.map(([name, value, type]) => (
          <label key={name} className={ui.label}>
            {name}
            <input name={name} type={type} step="any" min={type === 'number' ? 0 : undefined} defaultValue={value ?? ''} className={ui.input} />
          </label>
        ))}
        <label className={ui.label}>
          has12vhpwr
          <select name="has12vhpwr" defaultValue={p.has12vhpwr === null ? '' : String(p.has12vhpwr)} className={ui.input}>
            <option value="">—</option>
            <option value="true">да</option>
            <option value="false">нет</option>
          </select>
        </label>
      </section>

      <label className={ui.label}>
        specs (JSON-объект)
        <textarea name="specs" defaultValue={p.specs} rows={10} className={`${ui.input} font-mono`} />
      </label>

      <button className={ui.button}>Сохранить</button>
    </form>
  )
}
