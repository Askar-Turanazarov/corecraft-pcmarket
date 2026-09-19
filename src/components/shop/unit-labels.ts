import { getTranslations } from 'next-intl/server'
import type { UnitLabels } from './key-specs'

/** Подписи единиц для keySpecs на языке страницы. */
export async function unitLabels(): Promise<UnitLabels> {
  const t = await getTranslations('units')
  return { gb: t('gb'), mhz: t('mhz'), ghz: t('ghz'), w: t('w'), mm: t('mm'), cores: t('cores'), tb: t('tb') }
}
