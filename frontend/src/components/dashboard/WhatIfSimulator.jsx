import React, { useState } from 'react';
import { formatCurrency } from '../../lib/format';
import { Calculator, AlertTriangle, CheckCircle } from 'lucide-react';

export const WhatIfSimulator = ({ safeBalance }) => {
  const [amount, setAmount] = useState('');
  const [simulated, setSimulated] = useState(null);

  const handleSimulate = (e) => {
    e.preventDefault();
    if (!amount) return;
    
    const cost = parseFloat(amount);
    const newBalance = safeBalance - cost;
    setSimulated(newBalance);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={20} className="text-violet-400" />
        <h3 className="text-zinc-100 font-semibold">"What If" Simulator</h3>
      </div>
      
      <p className="text-sm text-zinc-400 mb-4">
        See how a purchase affects your stress-free balance.
      </p>

      <form onSubmit={handleSimulate} className="space-y-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">Rs</span>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount (e.g. 500 INR)"
            className="w-full bg-black border border-zinc-700 rounded-xl py-2 pl-8 pr-4 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
          />
        </div>
        
        <button 
          type="submit"
          className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors border border-zinc-700"
        >
          Check Impact
        </button>
      </form>

      {simulated !== null && (
        <div className={`mt-4 p-4 rounded-xl border ${simulated < 0 ? 'bg-rose-950/30 border-rose-900/50' : 'bg-emerald-950/30 border-emerald-900/50'}`}>
           <div className="flex items-start gap-3">
              {simulated < 0 ? (
                 <AlertTriangle size={20} className="text-rose-500 mt-0.5" />
              ) : (
                 <CheckCircle size={20} className="text-emerald-500 mt-0.5" />
              )}
              <div>
                 <p className={`font-medium ${simulated < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {simulated < 0 ? 'Warning: Negative Balance' : 'Safe to Buy!'}
                 </p>
                 <p className="text-sm text-zinc-400 mt-1">
                    New Safety Balance: <span className="text-white">{formatCurrency(simulated)}</span>
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
