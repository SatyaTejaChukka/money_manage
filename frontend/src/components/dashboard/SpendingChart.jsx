import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select } from '../ui/Select.jsx';
import { formatCurrency } from '../../lib/format.js';

export function SpendingChart({ data = [], range, onRangeChange }) {
  const normalizedData = (Array.isArray(data) ? data : []).map((item, index) => ({
    name: item?.name ?? item?.label ?? item?.date ?? `Point ${index + 1}`,
    amount: Number(item?.amount ?? item?.value ?? 0),
  }));

  const hasPlottableData = normalizedData.some((item) => Number.isFinite(item.amount));

  return (
    <Card className="bg-zinc-900/40 border-white/5 isolate relative z-0 h-full min-h-[420px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <CardTitle>Spending Overview</CardTitle>
        <div className="w-32">
            <Select 
                size="sm"
                options={[{ value: 'week', label: 'This Week' }, { value: 'month', label: 'This Month' }]} 
                value={range} 
                onChange={onRangeChange} 
            />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="h-[300px] sm:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {hasPlottableData ? (
              <AreaChart
                data={normalizedData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }} 
                  tickFormatter={(value) => formatCurrency(value, { compact: true })}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ stroke: '#52525b', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  fill="url(#colorAmount)" 
                  animationDuration={1200}
                />
              </AreaChart>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-zinc-500">
                No spending data to plot yet.
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
