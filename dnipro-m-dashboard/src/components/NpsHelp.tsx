import { useEffect, useState } from 'react'
import { Info, X } from 'lucide-react'

export default function NpsHelp() {
  const [open, setOpen] = useState(false)

  // Закриваємо по Esc
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded-md transition-colors"
        title="Що таке NPS і як читати ці показники"
      >
        <Info size={14} />
        <span>Що таке NPS?</span>
      </button>

      {open && (
        <>
          {/* Backdrop — клік закриває */}
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-ink-950/10"
          />
          {/* Popover */}
          <div
            role="dialog"
            aria-label="Довідка по NPS"
            className="absolute right-0 top-full mt-2 z-40 w-[min(640px,92vw)] card shadow-pop"
          >
            <div className="flex items-start justify-between p-5 border-b border-ink-200">
              <div>
                <h3 className="font-display text-xl font-semibold tracking-tight text-ink-900">
                  NPS — як це працює
                </h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  Net Promoter Score · індустрійний стандарт виміру лояльності клієнтів
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 -mr-1 text-ink-400 hover:text-ink-900 rounded-md hover:bg-ink-100"
                aria-label="Закрити"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm text-ink-700 leading-relaxed max-h-[70vh] overflow-y-auto">

              <p>
                Клієнт відповідає на питання типу <em>«Наскільки порекомендуєте Dnipro-M другу від 0 до 10?»</em>
                За оцінкою людину відносять до однієї з трьох груп:
              </p>

              <div className="rounded-lg border border-ink-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-ink-50 text-[11px] uppercase tracking-wider text-ink-500">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Група</th>
                      <th className="text-left px-3 py-2 font-medium">Оцінка</th>
                      <th className="text-left px-3 py-2 font-medium">Хто це</th>
                    </tr>
                  </thead>
                  <tbody className="text-ink-700">
                    <tr className="border-t border-ink-100">
                      <td className="px-3 py-2 font-medium text-emerald-700">Промоутери</td>
                      <td className="px-3 py-2 num">9–10</td>
                      <td className="px-3 py-2 text-ink-600">Лояльні, активно рекомендують</td>
                    </tr>
                    <tr className="border-t border-ink-100">
                      <td className="px-3 py-2 font-medium text-amber-700">Пасивні</td>
                      <td className="px-3 py-2 num">7–8</td>
                      <td className="px-3 py-2 text-ink-600">Задоволені, але без вау-ефекту</td>
                    </tr>
                    <tr className="border-t border-ink-100">
                      <td className="px-3 py-2 font-medium text-red-700">Детрактори</td>
                      <td className="px-3 py-2 num">0–6</td>
                      <td className="px-3 py-2 text-ink-600">Незадоволені, можуть нашкодити репутації</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-display text-base font-semibold text-ink-900 mb-2">Дві різні метрики</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-ink-200 rounded-lg p-3 bg-ink-50/40">
                    <div className="text-[10px] uppercase tracking-wider text-ink-500 font-medium">Середній NPS</div>
                    <div className="font-display text-lg font-semibold text-ink-900 mt-0.5">0–10</div>
                    <p className="text-xs text-ink-600 mt-1.5">
                      Звичайне <strong>середнє арифметичне</strong> всіх оцінок. Наприклад <span className="num">9.87</span> = клієнти в середньому ставлять майже максимум.
                    </p>
                  </div>
                  <div className="border border-ink-200 rounded-lg p-3 bg-ink-50/40">
                    <div className="text-[10px] uppercase tracking-wider text-ink-500 font-medium">NPS Score</div>
                    <div className="font-display text-lg font-semibold text-ink-900 mt-0.5">−100 … +100</div>
                    <p className="text-xs text-ink-600 mt-1.5">
                      <strong>% Промоутерів − % Детракторів.</strong> Пасивні не враховуються. Класична метрика, яку показують у звітах рад директорів.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-ink-500 mt-2">
                  Тонкий момент: ці показники можуть розходитись. Можна мати високий Сер. NPS (бо багато 7–8) і нульовий NPS Score (бо немає 9–10).
                </p>
              </div>

              <div>
                <h4 className="font-display text-base font-semibold text-ink-900 mb-2">Як читати NPS Score</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                    <div className="font-semibold text-emerald-700 num">&gt; 50</div>
                    <div className="text-emerald-700 mt-0.5">Дуже добре</div>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                    <div className="font-semibold text-amber-700 num">0 … 50</div>
                    <div className="text-amber-700 mt-0.5">Нормально</div>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-2.5">
                    <div className="font-semibold text-red-700 num">&lt; 0</div>
                    <div className="text-red-700 mt-0.5">Проблема</div>
                  </div>
                </div>
                <p className="text-xs text-ink-500 mt-2">
                  Наприклад <span className="num text-ink-900 font-medium">96</span> означає, що промоутерів суттєво більше за детракторів — близько до ідеалу.
                </p>
              </div>

              <div>
                <h4 className="font-display text-base font-semibold text-ink-900 mb-2">Що ще зустрічається в дашборді</h4>
                <ul className="space-y-1.5 text-xs text-ink-600 list-disc pl-5">
                  <li><strong className="text-ink-900">Пром / Детр</strong> у звіті (наприклад <span className="num">45 / 2</span>) — це <em>абсолютна кількість</em> промоутерів і детракторів у періоді. Зеленим — промоутери, червоним — детрактори.</li>
                  <li><strong className="text-ink-900">Зв'язатись</strong> — скільки клієнтів поставили галочку «Так, зв'яжіться зі мною» (поле <code className="font-mono text-[11px] bg-ink-100 px-1 rounded">contactBack</code> з Excel).</li>
                  <li><strong className="text-ink-900">Авторизовані / Неавторизовані</strong> — лишили номер телефону у формі (поле <code className="font-mono text-[11px] bg-ink-100 px-1 rounded">Телефон</code>). Авторизованих можна повторно ідентифікувати, неавторизованих — ні.</li>
                  <li><strong className="text-ink-900">Дельти у звіті</strong> (зелене ↑ / червоне ↓) — зміна відносно попереднього періоду (тижня або місяця).</li>
                </ul>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  )
}
