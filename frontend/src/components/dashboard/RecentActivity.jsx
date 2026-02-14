import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format.js';

export function RecentActivity({ transactions = [] }) {
  const maxMagnitude = useMemo(() => {
    if (!transactions.length) {
      return 1;
    }
    return Math.max(...transactions.map((item) => Math.abs(Number(item.amount || 0))), 1);
  }, [transactions]);

  return (
    <Card className="col-span-1 h-full bg-zinc-900/40 border-white/5">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="h-[340px] overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-6">
          {transactions.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No recent activity</p>
          ) : (
            transactions.map((t) => {
              const momentum = Math.max(
                6,
                Math.min(100, (Math.abs(Number(t.amount || 0)) / maxMagnitude) * 100)
              );
              return (
                <div key={t.id} className="relative flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                <div className="transaction-momentum-track">
                  <div
                    className={cn(
                      'transaction-momentum-fill',
                      t.type === 'income' ? 'from-emerald-400/30 to-emerald-300/5' : 'from-rose-400/30 to-rose-300/5'
                    )}
                    style={{ width: `${momentum}%` }}
                  />
                </div>
                <div className="flex items-center gap-4">
                    <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    t.type === 'income' 
                        ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20"
                    )}>
                    {t.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                    <p className="text-sm font-semibold text-white">{t.title}</p>
                    <p className="text-xs text-zinc-500">{t.date}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={cn(
                    "text-sm font-bold",
                    t.type === 'income' ? "text-emerald-400" : "text-white"
                    )}>
                    {t.type === 'income' ? '+' : ''}{formatCurrency(Math.abs(t.amount))}
                    </p>
                    <p className="text-xs text-zinc-500">{t.category}</p>
                </div>
                </div>
                );
              })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
