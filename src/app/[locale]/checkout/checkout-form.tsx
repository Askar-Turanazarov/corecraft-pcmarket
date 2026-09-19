'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { FlaskConical, Send } from 'lucide-react'
import { cn } from '@/lib/cn'
import { TASHKENT_DISTRICTS } from '@/lib/districts'
import { button, field as input } from '@/components/ui/styles'
import { placeOrder } from './actions'

export function CheckoutForm({ defaultName, mock }: { defaultName: string; mock: boolean }) {
  const t = useTranslations('checkout')
  const [state, action, pending] = useActionState(placeOrder, null)
  const bad = (field: string) => state?.fields?.includes(field)

  const field = (name: string, control: React.ReactNode) => (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{t(`fields.${name}`)}</span>
      {control}
      {bad(name) && <span className="block text-sm text-danger">{t(`invalid.${name}`)}</span>}
    </label>
  )

  return (
    <form action={action} className="space-y-5">
      {mock && (
        <p className="flex gap-2 rounded-[var(--radius-control)] border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('mockHint')}
        </p>
      )}
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
      {field('comment', <textarea name="comment" maxLength={500} rows={3} className={cn(input, 'resize-y')} />)}

      {state?.error && (
        <p role="alert" className="rounded-[var(--radius-control)] border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <button type="submit" disabled={pending} className={button('primary', 'lg', 'w-full')}>
        {!mock && <Send className="size-4" aria-hidden />}
        {pending ? t('processing') : mock ? t('submitMock') : t('submit')}
      </button>
      {!mock && <p className="text-sm text-muted">{t('telegramHint')}</p>}
    </form>
  )
}
