import { Cpu } from 'lucide-react'
import { cn } from '@/lib/cn'
import { panel } from '@/components/ui/styles'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center px-4 py-12 sm:py-20">
      <div className={cn(panel, 'w-full max-w-md p-6 sm:p-8')}>
        <span className="glow grid size-11 place-items-center rounded-[var(--radius-control)] border border-accent/40 text-accent">
          <Cpu className="size-5" aria-hidden />
        </span>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
