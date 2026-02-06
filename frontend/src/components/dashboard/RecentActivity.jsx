import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { ShoppingBag, Coffee, Home, ArrowUpRight, ArrowDownRight, CircleDollarSign } from 'lucide-react';
import { cn } from '../../lib/utils';

export function RecentActivity({ transactions = [] }) {
  const getIcon = (category) => {
      // Simple mapping or default
      return CircleDollarSign;
  };

  return (
    <Card className="col-span-1 h-full bg-zinc-900/40 border-white/5">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {transactions.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No recent activity</p>
          ) : (
            transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                <div className="flex items-center gap-4">
                    <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    t.type === 'income' 
                        ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20" 
                        : "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white"
                    )}>
                    {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
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
                    {t.type === 'income' ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-500">{t.category}</p>
                </div>
                </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
