import { notFound } from 'next/navigation'

// Неизвестный адрес внутри локали — показываем локализованную 404 из [locale]/not-found.tsx.
export default function CatchAll() {
  notFound()
}
