# Dnipro-M · Аналітика відгуків QR

Інтерактивний дашборд для аналізу відгуків клієнтів, зібраних через QR-коди. Підтримує завантаження Excel-файлу прямо в браузері (без бекенду), мульти-фільтри, часові ряди, агрегації по РМ/ТМ/містах і пошук у коментарях.

## Що вміє

- **6 типів візуалізацій**: часові ряди (день/тиждень), розподіл по днях тижня, топ-N РМ/ТМ/міст, ФМ vs ФФМ, запит зворотного зв'язку, розподіл рейтингів 1–5
- **KPI-картки**: загальна к-ть, середній NPS, NPS Score (промоутери − детрактори), % зворотного зв'язку
- **Інтерактивні фільтри**: діапазон дат, мульти-вибір РМ і ТМ з пошуком, тип точки, діапазон NPS, чекбокси
- **Таблиця коментарів**: повнотекстовий пошук, пагінація, кольорове кодування NPS
- **Excel upload**: SheetJS парсить .xlsx у браузері — нічого не йде на сервер
- **Авто-приклад**: при першому відкритті можна одним кліком завантажити вбудований приклад

## Запуск локально

```bash
# Встановити залежності
npm install

# Dev-сервер з гарячим перезавантаженням
npm run dev
# → відкриється http://localhost:5173

# Прод-збірка
npm run build

# Локальний preview прод-збірки
npm run preview
```

## Структура проекту

```
src/
├── components/
│   ├── KPICards.tsx          # 6 KPI-карток зверху
│   ├── FiltersPanel.tsx      # Панель фільтрів (дати, РМ, ТМ, тип, NPS)
│   ├── TimeSeriesChart.tsx   # Динаміка в часі (день/тиждень)
│   ├── WeekdayChart.tsx      # Розподіл по днях тижня
│   ├── TopGroupChart.tsx     # Топ РМ/ТМ/міст з сортуванням
│   ├── ShopTypeDonut.tsx     # ФМ vs ФФМ + Зв'язатись donut'и
│   ├── RatingDistChart.tsx   # Розподіл рейтингів 1-5
│   ├── CommentsTable.tsx     # Коментарі з пошуком
│   └── FileUploader.tsx      # Завантаження Excel
├── lib/
│   ├── parseExcel.ts         # SheetJS-парсер з resilient header lookup
│   ├── store.ts              # Zustand store + applyFilters
│   └── metrics.ts            # Усі агрегації (NPS, групування, тижні)
└── types/
    └── feedback.ts           # FeedbackRow, Filters
```

## Формат вхідного Excel

Шукається аркуш `data_source` (або перший аркуш, якщо такого немає). Колонки розпізнаються гнучко за частковим збігом назв (регістр і пробіли не мають значення):

| Поле в коді | Що шукається в заголовку |
|---|---|
| `date` | "дата" |
| `nps` | "nps" |
| `rating` | "рейтинг" |
| `location` | "об" (для "Об`єкт") |
| `comment` | "коментар" |
| `contactBack` | "radio" або "зв" |
| `rm` | "рм" |
| `tm` | "тм" |
| `shopType` | "фм" (для "ФМ/ФФМ") |

Дати приймаються у форматі `DD.MM.YYYY` або як Excel-серіали. Рядки без валідної дати пропускаються.

## Деплой на Vercel

```bash
# Перший раз
npm install -g vercel
vercel login
vercel

# Подальші пуші
vercel --prod
```

Vite-проект Vercel розпізнає автоматично: `npm run build` → `dist/`. Налаштовувати нічого не треба.

## Деплой на Netlify

1. Push коду в GitHub
2. На netlify.com → "Add new site" → "Import from Git"
3. Build command: `npm run build`
4. Publish directory: `dist`

Або через CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## Стек

| Бібліотека | Навіщо |
|---|---|
| **React 18 + TypeScript** | Компоненти, типізація |
| **Vite** | Швидкий dev-сервер і прод-збірка |
| **Tailwind CSS** | Стилізація без CSS-файлів |
| **Recharts** | Усі графіки (декларативно, на основі D3) |
| **SheetJS (xlsx)** | Парсинг .xlsx у браузері || **Zustand** | Лаконічний глобальний стейт |
| **Lucide React** | Іконки |
| **date-fns** | Робота з датами |

## Як додавати нові графіки

1. Додай функцію агрегації у `src/lib/metrics.ts`
2. Створи компонент у `src/components/`, який приймає `rows: FeedbackRow[]`
3. Вмонтуй у `src/App.tsx` після `KPICards` — він автоматично отримає вже відфільтровані дані

## Як додавати нові фільтри

1. Розшир `Filters` у `src/types/feedback.ts`
2. Додай логіку у `applyFilters` у `src/lib/store.ts`
3. Додай UI у `src/components/FiltersPanel.tsx`
