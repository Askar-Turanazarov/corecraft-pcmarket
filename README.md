# CoreCraft PC

**[English](#english) · [O'zbekcha](#ozbekcha) · [Русский](#русский)**

An online store for PC components, prebuilt desktops and laptops — with a hands-on
PC builder, a 3D view of the machine you are assembling, and an FPS estimator for
50+ demanding games. Prices in Uzbek so'm, payments through Telegram, three languages.

---

<a id="english"></a>
## English

### What it does

- **Shop** — components, prebuilt PCs, laptops and peripherals.
- **PC builder** — pick parts slot by slot with live compatibility checks (socket,
  form factor, GPU length, cooler height, PSU headroom, RAM type and slots).
- **3D view** — watch the machine take shape as you add parts, and rotate the finished build.
- **FPS estimator** — projected frames for low / medium / high / ultra presets at
  1080p, 1440p and 4K, with a CPU-vs-GPU bottleneck readout.
- **Telegram payments** — Bot API invoices in UZS, with a sandbox mode for development.
- **Three languages** — English, Uzbek, Russian.
- **Hidden admin panel** — reachable only at a secret path from the environment.

> The FPS numbers are a **model-based estimate, not a benchmark.** Every coefficient
> lives in the database and is editable from the admin panel.

### Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 ·
SQLite locally, PostgreSQL in production · next-intl · Auth.js v5 · react-three-fiber

### Getting started

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

The app runs at `http://localhost:3000`.

### Environment

Create a `.env` file in the project root. No `.env` file is ever committed.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `file:./dev.db` locally; a `postgresql://…` URL in production |
| `AUTH_SECRET` | Session signing key — generate with `npx auth secret` |
| `AUTH_URL` | Base URL of the app, e.g. `http://localhost:3000` |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather — used for payments and Telegram Login |
| `TELEGRAM_BOT_USERNAME` | Bot username, used by the Telegram Login widget |
| `TELEGRAM_PROVIDER_TOKEN` | Payment provider token. **Leave empty for sandbox mode** — payments are simulated locally, no bot or public HTTPS needed |
| `TELEGRAM_WEBHOOK_SECRET` | Any random string; Telegram echoes it back in a request header |
| `ADMIN_PATH` | URL segment of the hidden admin panel |
| `ADMIN_EMAIL` | Administrator account created by the seed |
| `ADMIN_PASSWORD` | Administrator password used by the seed |

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm test` | Unit tests for the compatibility, FPS and pricing engines |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed settings, admin, catalog and games |
| `npm run db:studio` | Browse the database |

---

<a id="ozbekcha"></a>
## O'zbekcha

### Imkoniyatlari

- **Do'kon** — butlovchi qismlar, yig'ilgan kompyuterlar, noutbuklar va aksessuarlar.
- **PK konstruktori** — qismlarni uyacha bo'yicha tanlash va moslikni darhol tekshirish
  (soket, form-faktor, videokarta uzunligi, kuler balandligi, quvvat zaxirasi, xotira turi).
- **3D ko'rinish** — qismlarni qo'shgan sari kompyuter qanday shakllanishini kuzating
  va tayyor yig'ilmani aylantirib ko'ring.
- **FPS hisobi** — past / o'rta / yuqori / ultra sozlamalarida 1080p, 1440p va 4K uchun
  taxminiy kadrlar, hamda protsessor yoki videokarta cheklovini ko'rsatish.
- **Telegram orqali to'lov** — UZS'da Bot API hisob-fakturalari, ishlab chiqish uchun sinov rejimi.
- **Uch til** — ingliz, o'zbek, rus.
- **Yashirin admin panel** — faqat muhit o'zgaruvchisidagi maxfiy manzil orqali ochiladi.

> FPS raqamlari — **model asosidagi taxmin, o'lchov emas.** Barcha koeffitsientlar
> ma'lumotlar bazasida saqlanadi va admin paneldan tahrirlanadi.

### Texnologiyalar

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 ·
mahalliy SQLite, ishlab chiqarishda PostgreSQL · next-intl · Auth.js v5 · react-three-fiber

### Ishga tushirish

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Ilova `http://localhost:3000` manzilida ishlaydi.

### Muhit o'zgaruvchilari

Loyiha ildizida `.env` faylini yarating. `.env` fayli hech qachon repozitoriyga yuklanmaydi.

| O'zgaruvchi | Vazifasi |
|---|---|
| `DATABASE_URL` | Mahalliy `file:./dev.db`; ishlab chiqarishda `postgresql://…` |
| `AUTH_SECRET` | Sessiyani imzolash kaliti — `npx auth secret` bilan yarating |
| `AUTH_URL` | Ilovaning asosiy manzili, masalan `http://localhost:3000` |
| `TELEGRAM_BOT_TOKEN` | @BotFather'dan olingan bot tokeni — to'lov va Telegram Login uchun |
| `TELEGRAM_BOT_USERNAME` | Telegram Login vidjeti uchun bot nomi |
| `TELEGRAM_PROVIDER_TOKEN` | To'lov provayderi tokeni. **Bo'sh qoldirilsa — sinov rejimi:** to'lov mahalliy taqlid qilinadi, bot va ochiq HTTPS talab etilmaydi |
| `TELEGRAM_WEBHOOK_SECRET` | Ixtiyoriy tasodifiy satr; Telegram uni sarlavhada qaytaradi |
| `ADMIN_PATH` | Yashirin admin panelning manzil qismi |
| `ADMIN_EMAIL` | Seed yaratadigan administrator hisobi |
| `ADMIN_PASSWORD` | Seed ishlatadigan administrator paroli |

### Buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Ishlab chiqish serveri |
| `npm run build` | Ishlab chiqarish uchun yig'ish |
| `npm run typecheck` | TypeScript tekshiruvi |
| `npm run lint` | ESLint |
| `npm test` | Moslik, FPS va narx modullari testlari |
| `npm run db:migrate` | Prisma migratsiyalarini qo'llash |
| `npm run db:seed` | Sozlamalar, administrator, katalog va o'yinlarni yuklash |
| `npm run db:studio` | Ma'lumotlar bazasini ko'rish |

---

<a id="русский"></a>
## Русский

### Что умеет

- **Магазин** — комплектующие, готовые ПК, ноутбуки и периферия.
- **Конструктор ПК** — подбор деталей по слотам с мгновенной проверкой совместимости
  (сокет, форм-фактор, длина видеокарты, высота кулера, запас по питанию, тип и число планок памяти).
- **3D-вид** — видно, как машина собирается по мере добавления деталей, готовую сборку можно вращать.
- **Расчёт FPS** — ожидаемые кадры на низких / средних / высоких / ультра настройках
  в 1080p, 1440p и 4K, с указанием упора в процессор или видеокарту.
- **Оплата через Telegram** — счета Bot API в сумах, для разработки есть режим песочницы.
- **Три языка** — английский, узбекский, русский.
- **Скрытая админ-панель** — доступна только по секретному пути из переменной окружения.

> Значения FPS — **оценка по модели, а не замер.** Все коэффициенты хранятся
> в базе и правятся из админ-панели.

### Стек

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 ·
локально SQLite, в проде PostgreSQL · next-intl · Auth.js v5 · react-three-fiber

### Запуск

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Приложение доступно на `http://localhost:3000`.

### Переменные окружения

Создайте файл `.env` в корне проекта. Файл `.env` в репозиторий не попадает никогда.

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | Локально `file:./dev.db`; в проде строка `postgresql://…` |
| `AUTH_SECRET` | Ключ подписи сессий — сгенерировать через `npx auth secret` |
| `AUTH_URL` | Базовый адрес приложения, например `http://localhost:3000` |
| `TELEGRAM_BOT_TOKEN` | Токен бота от @BotFather — нужен для оплаты и входа через Telegram |
| `TELEGRAM_BOT_USERNAME` | Имя бота для виджета Telegram Login |
| `TELEGRAM_PROVIDER_TOKEN` | Токен платёжного провайдера. **Пусто — режим песочницы:** оплата имитируется локально, бот и публичный HTTPS не нужны |
| `TELEGRAM_WEBHOOK_SECRET` | Произвольная случайная строка; Telegram возвращает её в заголовке |
| `ADMIN_PATH` | Сегмент адреса скрытой админ-панели |
| `ADMIN_EMAIL` | Учётная запись администратора, создаётся сидом |
| `ADMIN_PASSWORD` | Пароль администратора, используется сидом |

### Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | Сервер разработки |
| `npm run build` | Сборка для продакшена |
| `npm run typecheck` | Проверка типов TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Тесты движков совместимости, FPS и цен |
| `npm run db:migrate` | Применить миграции Prisma |
| `npm run db:seed` | Заполнить настройки, администратора, каталог и игры |
| `npm run db:studio` | Просмотр базы данных |
