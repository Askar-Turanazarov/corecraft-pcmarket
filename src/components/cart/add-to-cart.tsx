import { getTranslations } from 'next-intl/server'
import { ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/cn'
import { addToCart } from '@/app/[locale]/cart/actions'

export async function AddToCart({
  productId,
  stock,
  className,
}: {
  productId: string
  stock: number
  className?: string
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
      <button
        type="submit"
        disabled={!available}
        className={cn(
          'flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-medium',
          available
            ? 'bg-accent text-on-accent hover:bg-accent-strong'
            : 'cursor-not-allowed border border-border text-muted',
          className,
        )}
      >
        <ShoppingCart className="size-4" />
        {available ? t('cart.add') : t('cart.outOfStock')}
      </button>
    </form>
  )
}
