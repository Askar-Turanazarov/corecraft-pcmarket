import { getTranslations } from 'next-intl/server'
import { ShoppingCart } from 'lucide-react'
import { button } from '@/components/ui/styles'
import { addToCart } from '@/app/[locale]/cart/actions'

export async function AddToCart({
  productId,
  stock,
  className,
  size = 'md',
}: {
  productId: string
  stock: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const t = await getTranslations()
  const available = stock > 0

  return (
    <form
      action={async () => {
        'use server'
        await addToCart(productId)
      }}
    >
      <button type="submit" disabled={!available} className={button(available ? 'primary' : 'secondary', size, className)}>
        <ShoppingCart className="size-4" aria-hidden />
        {available ? t('cart.add') : t('cart.outOfStock')}
      </button>
    </form>
  )
}
