import { getTranslations } from 'next-intl/server'

// Поля движков совместимости и FPS — в том порядке, в каком их удобно читать.
const FIELDS = [
  'socket',
  'formFactor',
  'chipset',
  'coreCount',
  'boostGhz',
  'tdpW',
  'memoryType',
  'memorySlots',
  'memoryGb',
  'memoryMhz',
  'memorySticks',
  'vramGb',
  'storageGb',
  'storageType',
  'wattage',
  'has12vhpwr',
  'coolerType',
  'coolerTdpW',
  'radiatorMm',
  'lengthMm',
  'heightMm',
  'm2Slots',
  'sataPorts',
  'pcieVersion',
  'supportsFormFactors',
  'supportsRadiators',
  'supportsSockets',
]

const UNITS: Record<string, string> = {
  boostGhz: 'ghz',
  tdpW: 'w',
  coolerTdpW: 'w',
  wattage: 'w',
  memoryGb: 'gb',
  vramGb: 'gb',
  storageGb: 'gb',
  memoryMhz: 'mhz',
  radiatorMm: 'mm',
  lengthMm: 'mm',
  heightMm: 'mm',
}

/** Битый JSON не должен ронять страницу товара. */
function parseJson(raw: unknown): unknown {
  if (typeof raw !== 'string') return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function parseObject(raw: unknown): Record<string, unknown> {
  const parsed = parseJson(raw)
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>
  }
  return {}
}

/** Строки «подпись — значение» на языке страницы; их же сводит в таблицу страница сравнения. */
export async function specRows(product: Record<string, unknown>): Promise<Array<[string, string]>> {
  const t = await getTranslations('spec')
  const tExtra = await getTranslations('specExtra')
  const tValue = await getTranslations('specValue')
  const tUnit = await getTranslations('units')
  const tProduct = await getTranslations('product')

  const format = (key: string, value: unknown): string | null => {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'boolean') return value ? tProduct('yes') : tProduct('no')
    // Списки возможностей хранятся JSON-массивами в строке.
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'string' && value.startsWith('[')) {
      const parsed = parseJson(value)
      if (Array.isArray(parsed)) return parsed.length > 0 ? parsed.join(', ') : null
    }
    // Вложенные объекты из specs показать нечем — пропускаем.
    if (typeof value === 'object') return null

    // Значения из specs хранятся нейтральными токенами, чтобы переводиться.
    if (typeof value === 'string') {
      // Списки токенов через запятую («steel,mesh,temperedGlass») переводим поштучно.
      const tokens = value.split(',')
      if (tokens.every((token) => tValue.has(token) || token === 'RGB')) {
        return tokens.map((token) => (tValue.has(token) ? tValue(token) : token)).join(', ')
      }
      const months = value.match(/^(\d+) months$/)
      if (months) return `${months[1]} ${tUnit('months')}`
    }

    const unit = UNITS[key]
    return unit ? `${String(value)} ${tUnit(unit)}` : String(value)
  }

  const rows: Array<[string, string]> = []
  const push = (key: string, value: unknown) => {
    const formatted = format(key, value)
    if (formatted !== null) {
      // Подпись ищем сначала среди полей движков, затем среди свободных specs.
      // У корпуса длина и высота — это пределы для видеокарты и кулера.
      const caseKey = product.category === 'case' ? `${key}Case` : key
      const label = t.has(caseKey) ? t(caseKey) : t.has(key) ? t(key) : tExtra.has(key) ? tExtra(key) : key
      rows.push([label, formatted])
    }
  }

  for (const key of FIELDS) push(key, product[key])
  // Всё, что не поместилось в колонки, лежит JSON-строкой в specs.
  for (const [key, value] of Object.entries(parseObject(product.specs))) push(key, value)
  return rows
}

export async function SpecTable({ product }: { product: Record<string, unknown> }) {
  const [rows, tProduct] = await Promise.all([specRows(product), getTranslations('product')])
  if (rows.length === 0) {
    return <p className="text-sm text-muted">{tProduct('noSpecs')}</p>
  }

  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-border last:border-0">
            <th scope="row" className="py-2 pr-4 text-left font-normal text-muted">
              {label}
            </th>
            <td className="py-2 text-right">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
