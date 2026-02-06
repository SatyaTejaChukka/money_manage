import React from 'react';
import { Lightbulb, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export function InsightsPanel({ insights = [] }) {
  if (!insights.length) {
    return (
        <div className="h-full rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 flex items-center justify-center p-8">
            <div className="text-center">
                <Lightbulb className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <h3 className="text-zinc-500 font-medium">No Insights Yet</h3>
                <p className="text-sm text-zinc-600">Keep using the app to get smart tips.</p>
            </div>
        </div>
    );
  }

  const getIcon = (type) => {
      switch(type) {
          case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
          case 'danger': return <AlertTriangle className="w-5 h-5 text-rose-400" />;
          case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
          default: return <Info className="w-5 h-5 text-blue-400" />;
      }
  };

  const getBg = (type) => {
    switch(type) {
        case 'warning': return 'bg-amber-500/10 border-amber-500/20';
        case 'danger': return 'bg-rose-500/10 border-rose-500/20';
        case 'success': return 'bg-emerald-500/10 border-emerald-500/20';
        default: return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-semibold text-white">Smart Insights</h3>
        </div>
        <div className="space-y-3">
            {insights.map((insight, idx) => (
                <div 
                    key={idx} 
                    className={cn(
                        "p-4 rounded-xl border flex gap-3 items-start transition-all hover:scale-[1.02]",
                        getBg(insight.type)
                    )}
                >
                    <div className="mt-0.5 shrink-0">{getIcon(insight.type)}</div>
                    <div>
                        <h4 className="text-sm font-semibold text-white">{insight.title}</h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{insight.message}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
