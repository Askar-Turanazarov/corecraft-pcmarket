import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Склейка классов Tailwind: последний конфликтующий побеждает. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
