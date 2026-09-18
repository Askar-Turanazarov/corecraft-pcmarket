import path from 'node:path'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  // Копии проекта в .claude/worktrees иначе запускаются вторым набором и делят одну базу.
  test: { exclude: [...configDefaults.exclude, '.claude/**'] },
})
