import React from 'react';
import { ArrowRight, CheckCircle2, TriangleAlert } from 'lucide-react';

import { formatCurrency } from '../../lib/format.js';
import { cn } from '../../lib/utils.js';

const FlowItem = ({ label, amount, color }) => (
  <div className="flex flex-col items-center min-w-0">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${color} bg-zinc-900 mb-2`}>
      <div className={`w-3 h-3 rounded-full ${color.replace('border-', 'bg-')}`} />
    </div>
    <span className="text-xs text-zinc-400 font-medium">{label}</span>
    <span className="text-sm font-bold text-white mt-1 tabular-nums">{formatCurrency(amount)}</span>
  </div>
);

function RuleProgressBar({ label, amount, percent, tone }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300 tabular-nums">{formatCurrency(amount)}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', tone)}
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

export const MoneyFlow = ({ stats }) => {
  if (!stats) {
    return null;
  }

  const { total_income, total_committed, safe_to_spend, salary_rule_engine: engine } = stats;
  const committedPct = total_income > 0 ? Math.min((total_committed / total_income) * 100, 100) : 0;

  const allocation = engine?.allocation || {};
  const goals = Array.isArray(engine?.buckets?.goals) ? engine.buckets.goals : [];
  const plannedExpenses = Array.isArray(engine?.buckets?.planned_expenses) ? engine.buckets.planned_expenses : [];
  const topGoalAllocations = goals.slice(0, 3);
  const topPlannedExpenses = plannedExpenses.slice(0, 3);

  const salaryBasis = Number(engine?.salary_considered || 0);
  const splitPercentages = salaryBasis <= 0
    ? { commitments: 0, goals: 0, freeMoney: 0 }
    : {
        commitments: (Number(allocation.commitments || 0) / salaryBasis) * 100,
        plannedExpenses: (Number(allocation.planned_expenses || 0) / salaryBasis) * 100,
        goals: (Number(allocation.goals || 0) / salaryBasis) * 100,
        freeMoney: (Number(allocation.free_money || 0) / salaryBasis) * 100,
      };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-zinc-100 font-semibold mb-6 flex items-center gap-2">
        Money Flow
      </h3>

      <div className="flex items-center justify-between relative">
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-zinc-800 z-0" />

        <div className="relative z-10 bg-zinc-900 px-2">
          <FlowItem label="Income" amount={total_income} color="border-emerald-500" />
        </div>

        <ArrowRight size={16} className="text-zinc-600" />

        <div className="relative z-10 bg-zinc-900 px-2">
          <FlowItem label="Committed" amount={total_committed} color="border-blue-500" />
        </div>

        <ArrowRight size={16} className="text-zinc-600" />

        <div className="relative z-10 bg-zinc-900 px-2">
          <FlowItem label="Safe Space" amount={safe_to_spend} color="border-violet-500" />
        </div>
      </div>

      <div className="mt-8 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
        <div className="flex justify-between items-center text-sm">
          <span className="text-zinc-400">Monthly Commitments</span>
          <span className="text-white font-medium tabular-nums">{formatCurrency(total_committed)}</span>
        </div>
        <div className="w-full bg-zinc-700 h-1.5 rounded-full mt-2 mb-4">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${committedPct}%` }} />
        </div>

        <p className="text-xs text-zinc-500">
          Includes fixed bills, subscriptions, and savings goals.
        </p>
      </div>

      {engine ? (
        <div className="mt-5 p-4 bg-black/25 rounded-xl border border-white/10 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Salary Rule Engine</p>
              <p className="text-sm text-zinc-300 mt-1">{engine.status_message}</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Source: {engine.salary_source === 'income_transactions' ? 'This month income transactions' : engine.salary_source === 'income_sources' ? 'Income source settings' : 'Manual override'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Salary considered</p>
              <p className="text-sm font-semibold text-white tabular-nums">{formatCurrency(engine.salary_considered)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <RuleProgressBar
              label="Commitments First"
              amount={Number(allocation.commitments || 0)}
              percent={splitPercentages.commitments}
              tone="bg-blue-500"
            />
            <RuleProgressBar
              label="Planned Expenses"
              amount={Number(allocation.planned_expenses || 0)}
              percent={splitPercentages.plannedExpenses}
              tone="bg-amber-500"
            />
            <RuleProgressBar
              label="Goals by Priority"
              amount={Number(allocation.goals || 0)}
              percent={splitPercentages.goals}
              tone="bg-indigo-500"
            />
            <RuleProgressBar
              label="Free Money"
              amount={Number(allocation.free_money || 0)}
              percent={splitPercentages.freeMoney}
              tone="bg-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-zinc-900/70 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500 mb-2">Top Planned Expenses</p>
              {topPlannedExpenses.length === 0 ? (
                <p className="text-xs text-zinc-500">No planned expense rules</p>
              ) : (
                <div className="space-y-2">
                  {topPlannedExpenses.map((expense) => (
                    <div key={expense.rule_id} className="text-xs flex items-center justify-between gap-3">
                      <span className="text-zinc-300 truncate">{expense.category_name}</span>
                      <span className="tabular-nums text-zinc-200">
                        {formatCurrency(expense.allocated || 0)} / {formatCurrency(expense.requested || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-zinc-900/70 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500 mb-2">Top Goal Allocations</p>
              {topGoalAllocations.length === 0 ? (
                <p className="text-xs text-zinc-500">No active goals</p>
              ) : (
                <div className="space-y-2">
                  {topGoalAllocations.map((goal) => (
                    <div key={goal.goal_id} className="text-xs flex items-center justify-between gap-3">
                      <span className="text-zinc-300 truncate">{goal.goal_name} (P{goal.priority})</span>
                      <span className="tabular-nums text-zinc-200">
                        {formatCurrency(goal.allocated)} / {formatCurrency(goal.requested)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-zinc-900/70 p-3 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500 mb-2">Rule Health</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  {allocation.free_money_floor_met ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : (
                    <TriangleAlert size={14} className="text-amber-400" />
                  )}
                  <span>
                    Free floor target: {formatCurrency(allocation.free_money_floor_target || 0)}
                  </span>
                </div>

                {(engine.warnings || []).length === 0 ? (
                  <p className="text-emerald-300">No rule warnings</p>
                ) : (
                  engine.warnings.slice(0, 2).map((warning) => (
                    <p key={warning} className="text-amber-300">{warning}</p>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
