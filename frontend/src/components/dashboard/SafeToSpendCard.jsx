import React from 'react';
import { formatCurrency } from '../../lib/format';
import { ShieldCheck, TrendingUp, AlertCircle } from 'lucide-react';

export const SafeToSpendCard = ({ stats }) => {
  if (!stats) return null;

  const { safe_to_spend, total_income } = stats;
  const percentage = total_income > 0 ? (safe_to_spend / total_income) * 100 : 0;
  
  let statusColor = "bg-emerald-500";
  let statusText = "Healthy Balance";
  
  if (percentage < 20) {
    statusColor = "bg-rose-500";
    statusText = "Low Balance Warning";
  } else if (percentage < 40) {
    statusColor = "bg-amber-500";
    statusText = "Tight Budget";
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 ${statusColor} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-zinc-400 font-medium text-sm">Stress-Free Balance</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Safe to spend after bills & goals</p>
            </div>
            <div className={`p-2 rounded-full bg-zinc-800 border border-zinc-700 ${percentage < 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
               <ShieldCheck size={20} />
            </div>
          </div>
          
          <div className="mt-4">
             <span className="text-4xl font-bold text-white tracking-tight">
                {formatCurrency(safe_to_spend)}
             </span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
             <div 
               className={`h-full ${statusColor} transition-all duration-500 ease-out`}
               style={{ width: `${Math.min(percentage, 100)}%` }}
             />
          </div>
          
          <div className="flex justify-between text-xs text-zinc-500">
             <span>{Math.round(percentage)}% of Income Available</span>
             <span className={percentage < 20 ? 'text-rose-400' : 'text-emerald-400'}>{statusText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
