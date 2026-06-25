'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface DashboardChartProps {
  available: number
  borrowed: number
  overdue: number
  maintenance: number
}

const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#94a3b8']
const LABELS = ['Available', 'Borrowed', 'Overdue', 'Maintenance']

export default function DashboardChart({ available, borrowed, overdue, maintenance }: DashboardChartProps) {
  const data = [
    { name: 'Available', value: available },
    { name: 'Borrowed', value: borrowed },
    { name: 'Overdue', value: overdue },
    { name: 'Maintenance', value: maintenance },
  ].filter(d => d.value > 0)

  if (!data.length) return null

  const total = available + borrowed + overdue + maintenance

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Status Overview</h3>
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={50}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[LABELS.indexOf(entry.name)]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} items`, '']}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5">
          {data.map((entry) => {
            const colorIndex = LABELS.indexOf(entry.name)
            return (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[colorIndex] }} />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{entry.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{entry.value}</span>
                  <span className="text-xs text-slate-400">{Math.round(entry.value / total * 100)}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
