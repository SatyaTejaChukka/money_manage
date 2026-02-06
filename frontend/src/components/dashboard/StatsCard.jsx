import React from 'react';
import { Card, CardContent } from '../ui/Card.jsx';
import { cn } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function StatsCard({ title, value, trend, trendValue, icon: Icon, color = "violet" }) {
  const isPositive = trend === 'up';
  
  const colors = {
    violet: "from-violet-600 to-indigo-600 shadow-violet-500/20",
    emerald: "from-emerald-500 to-teal-500 shadow-emerald-500/20",
    rose: "from-rose-500 to-pink-500 shadow-rose-500/20",
    amber: "from-amber-500 to-orange-500 shadow-amber-500/20",
    blue: "from-blue-500 to-cyan-500 shadow-blue-500/20",
  };

  return (
    <Card className="hover:scale-[1.02] transition-transform duration-300 border-white/5 bg-zinc-900/40">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
          </div>
          <div className={cn(
            "p-3 rounded-xl bg-linear-to-br shadow-lg flex items-center justify-center",
            colors[color]
          )}>
            <Icon size={20} className="text-white" />
          </div>
        </div>
        
        {trendValue && (
          <div className="mt-4 flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
              trend === 'up' && color !== 'rose' || trend === 'down' && color === 'rose'
                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" 
                : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
            )}>
              {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{trendValue}</span>
            </div>
            <span className="text-xs text-zinc-500">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
