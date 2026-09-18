import { describe, expect, it } from 'vitest'
import { formatUzs, formatUsdApprox, DEFAULT_USD_RATE } from '../money'

describe('formatUzs', () => {
  it('ставит суффикс валюты по локали', () => {
    expect(formatUzs(12450000, 'ru')).toContain('сум')
    expect(formatUzs(12450000, 'uz')).toContain("so'm")
    expect(formatUzs(12450000, 'en')).toContain('UZS')
  })

  it('разделяет разряды', () => {
    // Пробел может быть неразрывным или узким — сравниваем по цифрам.
    expect(formatUzs(12450000, 'ru').replace(/\D/g, '')).toBe('12450000')
    expect(formatUzs(12450000, 'ru')).not.toBe('12450000 сум')
  })

  it('округляет дробные суммы — в сумах копеек нет', () => {
    expect(formatUzs(1000.4, 'en').replace(/\D/g, '')).toBe('1000')
    expect(formatUzs(1000.6, 'en').replace(/\D/g, '')).toBe('1001')
  })
})

describe('formatUsdApprox', () => {
  it('переводит по курсу по умолчанию', () => {
    expect(formatUsdApprox(DEFAULT_USD_RATE * 100, 'en')).toBe('$100')
  })

  it('принимает курс из настроек', () => {
    expect(formatUsdApprox(24000, 'en', 12000)).toBe('$2')
  })

  it('не показывает центы', () => {
    expect(formatUsdApprox(11900 * 1.5, 'en')).not.toContain('.')
  })
})
