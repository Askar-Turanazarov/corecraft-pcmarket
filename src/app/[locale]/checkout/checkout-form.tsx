'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/cn'
import { TASHKENT_DISTRICTS } from '@/lib/districts'
import { placeOrder } from './actions'

const input = 'w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent'

export function CheckoutForm({ defaultName, mock }: { defaultName: string; mock: boolean }) {
  const t = useTranslations('checkout')
  const [state, action, pending] = useActionState(placeOrder, null)
  const bad = (field: string) => state?.fields?.includes(field)

  const field = (name: string, control: React.ReactNode) => (
    <label className="block space-y-1.5">
      <span className="text-sm text-muted">{t(`fields.${name}`)}</span>
      {control}
      {bad(name) && <span className="block text-xs text-danger">{t(`invalid.${name}`)}</span>}
    </label>
  )

  return (
    <form action={action} className="space-y-4">
      {field('name', <input name="name" required minLength={2} maxLength={80} defaultValue={defaultName} autoComplete="name" className={cn(input, bad('name') && 'border-danger')} />)}
      {field(
        'phone',
        <input name="phone" type="tel" required placeholder="+998 90 123 45 67" autoComplete="tel" className={cn(input, bad('phone') && 'border-danger')} />,
      )}
      {field(
        'district',
        <select name="district" required defaultValue="" className={cn(input, bad('district') && 'border-danger')}>
          <option value="" disabled>
            {t('chooseDistrict')}
          </option>
          {TASHKENT_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {t(`districts.${d}`)}
            </option>
          ))}
        </select>,
      )}
      {field('address', <input name="address" required minLength={5} maxLength={200} placeholder={t('addressPlaceholder')} autoComplete="street-address" className={cn(input, bad('address') && 'border-danger')} />)}
      {field('comment', <textarea name="comment" maxLength={500} rows={3} className={input} />)}

      {state?.error && <p className="text-sm text-danger">{t(`errors.${state.error}`)}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent py-3 font-medium text-on-accent hover:bg-accent-strong disabled:opacity-60"
      >
        {pending ? t('processing') : mock ? t('submitMock') : t('submit')}
      </button>
      <p className="text-xs text-muted">{mock ? t('mockHint') : t('telegramHint')}</p>
    </form>
  )
}
