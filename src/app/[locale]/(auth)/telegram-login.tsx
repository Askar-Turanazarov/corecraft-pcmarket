'use client'

import { useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'

// Официальный виджет Telegram Login: скрипт сам рисует кнопку и вызывает колбэк
// с подписанными данными, подпись проверяет провайдер 'telegram' на сервере.
// Работает только на домене, привязанном к боту в @BotFather (/setdomain).
export function TelegramLogin({ bot, next }: { bot: string; next: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onAuth = (user: Record<string, string | number>) =>
      signIn('telegram', { ...Object.fromEntries(Object.entries(user).map(([k, v]) => [k, String(v)])), redirectTo: next })
    Object.assign(window, { onTelegramAuth: onAuth })

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.dataset.telegramLogin = bot
    script.dataset.size = 'large'
    script.dataset.onauth = 'onTelegramAuth(user)'
    script.dataset.requestAccess = 'write'
    const box = ref.current
    box?.appendChild(script)
    return () => {
      box?.replaceChildren()
    }
  }, [bot, next])

  return <div ref={ref} className="min-h-10" />
}
