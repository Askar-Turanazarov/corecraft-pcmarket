import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { saveProduct } from '../../actions'
import { cn } from '@/lib/cn'
import { button, field, panel, sectionTitle } from '@/components/ui/styles'
import { PRODUCT_FLOAT, PRODUCT_INT, PRODUCT_JSON, PRODUCT_STR, one, requireAdmin } from '../../admin'
import { ErrorNote, check, checkbox, label, title } from '../../admin-ui'

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
    <form action={saveProduct} className="max-w-5xl space-y-6">
      <input type="hidden" name="id" value={p.id} />
      <div>
        <h1 className={title}>{p.nameRu}</h1>
        <p className="mt-1 text-sm text-muted">{p.slug} · {p.category} · {p.brand} {p.model}</p>
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}

      <section className={cn(panel, 'grid gap-4 p-5 sm:grid-cols-3 sm:p-6')}>
        <h2 className={cn(sectionTitle, 'sm:col-span-3')}>Основное</h2>
        <label className={label}>nameRu<input name="nameRu" defaultValue={p.nameRu} required className={field} /></label>
        <label className={label}>nameUz<input name="nameUz" defaultValue={p.nameUz} required className={field} /></label>
        <label className={label}>nameEn<input name="nameEn" defaultValue={p.nameEn} required className={field} /></label>
        <label className={label}>priceUzs<input name="priceUzs" type="number" min={0} defaultValue={p.priceUzs} required className={cn(field, 'tabular')} /></label>
        <label className={label}>oldPriceUzs<input name="oldPriceUzs" type="number" min={0} defaultValue={p.oldPriceUzs ?? ''} className={cn(field, 'tabular')} /></label>
        <label className={label}>stock<input name="stock" type="number" min={0} defaultValue={p.stock} required className={cn(field, 'tabular')} /></label>
        <label className={cn(check, 'sm:col-span-3')}>
          <input name="isActive" type="checkbox" defaultChecked={p.isActive} className={checkbox} /> Активен (виден в каталоге)
        </label>
      </section>

      <section className={cn(panel, 'grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4')}>
        <h2 className={cn(sectionTitle, 'sm:col-span-2 lg:col-span-4')}>Поля движков совместимости и FPS</h2>
        {engine.map(([name, value, type]) => (
          <label key={name} className={label}>
            {name}
            <input name={name} type={type} step="any" min={type === 'number' ? 0 : undefined} defaultValue={value ?? ''} className={cn(field, type === 'number' && 'tabular')} />
          </label>
        ))}
        <label className={label}>
          has12vhpwr
          <select name="has12vhpwr" defaultValue={p.has12vhpwr === null ? '' : String(p.has12vhpwr)} className={field}>
            <option value="">—</option>
            <option value="true">да</option>
            <option value="false">нет</option>
          </select>
        </label>
      </section>

      <section className={cn(panel, 'p-5 sm:p-6')}>
        <label className={label}>
          specs (JSON-объект)
          <textarea name="specs" defaultValue={p.specs} rows={10} className={cn(field, 'font-mono text-sm')} />
        </label>
      </section>

      <button className={button('primary', 'lg')}>Сохранить</button>
    </form>
  )
}
