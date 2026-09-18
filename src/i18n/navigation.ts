import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Link/router, которые сами подставляют текущую локаль в адрес.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
