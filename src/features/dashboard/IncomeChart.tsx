import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/Page'
import { formatDate, formatMonth, parseISODate } from '@/lib/dates'
import { LOCALE } from '@/lib/i18n'
import { fromMinor } from '@/lib/money'
import type { SeriesPoint } from '@/lib/stats'
import { useMoney } from '@/hooks/useMoney'
import { useT } from '@/hooks/useT'

const monthShort = (key: string, locale: string) => {
  const d = parseISODate(`${key}-01`)
  return d ? new Intl.DateTimeFormat(locale, { month: 'short' }).format(d).replace('.', '') : key
}

/** Income vs costs bars: one bar pair per day (month periods) or per month (all time). */
export function IncomeChart({ series }: { series: SeriesPoint[] }) {
  const { t, lang } = useT()
  const money = useMoney()
  const byMonth = series[0]?.key.length === 7
  // Axis: compact number without the currency ("1,2 тыс."); the tooltip shows full money.
  const axisFmt = new Intl.NumberFormat(LOCALE[lang], { notation: 'compact', maximumFractionDigits: 1 })
  const empty = series.every((p) => p.income === 0 && p.costs === 0)
  const tick = (key: string) => (byMonth ? monthShort(key, LOCALE[lang]) : String(Number(key.slice(8))))
  const fullLabel = (key: string) => (byMonth ? formatMonth(key, lang) : formatDate(key, lang))

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="font-extrabold">{t('dashboard.chart.title')}</h2>
        {!empty && (
          <div className="flex gap-3 text-xs font-bold text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-mint" aria-hidden />
              {t('dashboard.chart.income')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-peach" aria-hidden />
              {t('dashboard.chart.costs')}
            </span>
          </div>
        )}
      </div>
      {empty ? (
        <p className="py-10 text-center text-sm font-semibold text-muted">{t('dashboard.chart.empty')}</p>
      ) : (
        <div className="h-56 md:h-64" data-testid="income-chart">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 224 }}>
            <BarChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barGap={1} barCategoryGap={byMonth ? '25%' : '15%'}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="key"
                tickFormatter={tick}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--ink-muted)', fontSize: 11, fontWeight: 600 }}
                minTickGap={8}
              />
              <YAxis
                tickFormatter={(v: number) => axisFmt.format(fromMinor(v))}
                tickLine={false}
                axisLine={false}
                width={52}
                tick={{ fill: 'var(--ink-muted)', fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-2)', opacity: 0.6 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0]?.payload as SeriesPoint | undefined
                  if (!p) return null
                  return (
                    <div className="rounded-2xl bg-surface px-3 py-2 text-sm shadow-soft ring-1 ring-line">
                      <div className="pb-1 font-extrabold">{fullLabel(String(label))}</div>
                      <div className="tabular flex justify-between gap-4 font-semibold">
                        <span className="text-mint">{t('dashboard.chart.income')}</span>
                        <span>{money(p.income)}</span>
                      </div>
                      <div className="tabular flex justify-between gap-4 font-semibold">
                        <span className="text-peach">{t('dashboard.chart.costs')}</span>
                        <span>{money(p.costs)}</span>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="income" fill="var(--mint)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
              <Bar dataKey="costs" fill="var(--peach)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
