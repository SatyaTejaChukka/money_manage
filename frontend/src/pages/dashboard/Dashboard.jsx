import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StatsCard } from '../../components/dashboard/StatsCard.jsx';
import HealthScoreGauge from '../../components/HealthScoreGauge.jsx';
import { SpendingChart } from '../../components/dashboard/SpendingChart.jsx';
import { RecentActivity } from '../../components/dashboard/RecentActivity.jsx';
import { InsightsPanel } from '../../components/dashboard/InsightsPanel.jsx';
import { FinancialTriagePanel } from '../../components/dashboard/FinancialTriagePanel.jsx';
import { ActionCenter } from '../../components/dashboard/ActionCenter.jsx';
import { NotificationBell } from '../../components/notifications/NotificationBell.jsx';
import {
  ArrowUpRight,
  GripVertical,
  LayoutDashboard,
  PiggyBank,
  RotateCcw,
  TrendingUp,
  Volume2,
  VolumeX,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';
import { dashboardService } from '../../services/dashboard.js';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../lib/format.js';
import { cn } from '../../lib/utils.js';
import { SafeToSpendOrb } from '../../components/orb/SafeToSpendOrb.jsx';
import { MoneyFlow } from '../../components/dashboard/MoneyFlow.jsx';
import { WhatIfSimulator } from '../../components/dashboard/WhatIfSimulator.jsx';
import { TimelineView } from '../../components/timeline/TimelineView.jsx';
import { MoneyWeatherBackdrop } from '../../components/dashboard/MoneyWeatherBackdrop.jsx';
import { useFinanceFeedback } from '../../hooks/useFinanceFeedback.js';

const COCKPIT_LAYOUT_STORAGE_KEY = 'dashboard-cockpit-layout-v1';
const DEFAULT_DECK_ORDER = ['operations', 'analytics', 'timeline'];
const EMPTY_SUMMARY = {
  total_balance: 0,
  balance_change: 0,
  monthly_income: 0,
  monthly_expenses: 0,
  income_change: 0,
  expenses_change: 0,
  total_savings: 0,
  health_score: { score: 0, message: 'No data', color: 'blue' },
  recent_transactions: [],
  spending_chart: [],
  safe_to_spend_stats: null,
};

function normalizeDeckOrder(value) {
  if (!Array.isArray(value)) {
    return DEFAULT_DECK_ORDER;
  }
  const unique = Array.from(new Set(value.filter((sectionId) => DEFAULT_DECK_ORDER.includes(sectionId))));
  const missing = DEFAULT_DECK_ORDER.filter((sectionId) => !unique.includes(sectionId));
  return [...unique, ...missing];
}

function readDeckOrder() {
  try {
    const raw = window.localStorage.getItem(COCKPIT_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_DECK_ORDER;
    }
    return normalizeDeckOrder(JSON.parse(raw));
  } catch {
    return DEFAULT_DECK_ORDER;
  }
}

function reorderDeck(order, sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) {
    return order;
  }
  const sourceIndex = order.indexOf(sourceId);
  const targetIndex = order.indexOf(targetId);
  if (sourceIndex < 0 || targetIndex < 0) {
    return order;
  }
  const next = [...order];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chartRange, setChartRange] = useState('week');
  const [data, setData] = useState(null);
  const [triage, setTriage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cockpitMode, setCockpitMode] = useState(false);
  const [deckOrder, setDeckOrder] = useState(() => readDeckOrder());
  const [draggingDeck, setDraggingDeck] = useState(null);
  const { enabled: feedbackEnabled, toggle: toggleFeedback, feedback } = useFinanceFeedback();

  useEffect(() => {
    const fetchDashboard = async () => {
        try {
            setIsLoading(true);
            const [stats, triageData] = await Promise.all([
              dashboardService.getSummary(chartRange),
              dashboardService.getTriage(),
            ]);
            setData(stats);
            setTriage(triageData);
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchDashboard();

    const onTransactionsChanged = () => {
      fetchDashboard();
    };
    window.addEventListener('transactions:changed', onTransactionsChanged);
    return () => window.removeEventListener('transactions:changed', onTransactionsChanged);
  }, [chartRange]);

  useEffect(() => {
    try {
      window.localStorage.setItem(COCKPIT_LAYOUT_STORAGE_KEY, JSON.stringify(deckOrder));
    } catch {
      // Ignore storage failures.
    }
  }, [deckOrder]);

  const summary = useMemo(() => data || EMPTY_SUMMARY, [data]);
  const autopilotReady =
    Number(summary.monthly_income || 0) > 0 ||
    Number(summary.safe_to_spend_stats?.total_committed || 0) > 0;
  const autopilotStatusText = autopilotReady
    ? 'Autopilot is calculating from your live income, commitments, and transactions.'
    : 'Add income, bills, subscriptions, or goals to start autopilot calculations.';

  const handleActionClick = useCallback((action) => {
    if (action?.action_route) {
      navigate(action.action_route);
    }
  }, [navigate]);

  const deckSections = useMemo(
    () => ({
      operations: {
        title: 'Operations Deck',
        content: (
          <div className="relative flex flex-col xl:flex-row xl:items-start gap-6">
            <div className="relative min-w-0 xl:basis-[66.666%] xl:max-w-[66.666%] space-y-4">
              {triage?.actions?.length > 0 && (
                <ActionCenter actions={triage.actions} onAction={handleActionClick} />
              )}
              <FinancialTriagePanel triage={triage} />
            </div>

            <div className="relative min-w-0 xl:basis-[33.333%] xl:max-w-[33.333%] space-y-6">
              <WhatIfSimulator safeBalance={summary.safe_to_spend_stats?.safe_to_spend || 0} />
              <HealthScoreGauge />
              <InsightsPanel insights={summary.health_score.insights || []} />
            </div>
          </div>
        ),
      },
      analytics: {
        title: 'Analytics Deck',
        content: (
          <div className="relative flex flex-col xl:flex-row xl:items-start gap-6">
            <div className="relative min-w-0 xl:basis-[66.666%] xl:max-w-[66.666%] h-[420px]">
              <SpendingChart
                data={summary.spending_chart}
                range={chartRange}
                onRangeChange={setChartRange}
              />
            </div>

            <div className="relative min-w-0 xl:basis-[33.333%] xl:max-w-[33.333%] h-[420px]">
              <RecentActivity transactions={summary.recent_transactions} />
            </div>
          </div>
        ),
      },
      timeline: {
        title: 'Timeline Deck',
        content: (
          <div className="w-full isolate">
            <TimelineView />
          </div>
        ),
      },
    }),
    [chartRange, handleActionClick, summary, triage]
  );

  const handleDeckDrop = (targetId) => (event) => {
    if (!cockpitMode) {
      return;
    }
    event.preventDefault();
    const sourceId = draggingDeck || event.dataTransfer.getData('text/plain');
    if (!sourceId) {
      return;
    }
    setDeckOrder((prev) => reorderDeck(prev, sourceId, targetId));
    setDraggingDeck(null);
    feedback('scrub');
  };

  const handleDeckDragStart = (sectionId) => (event) => {
    if (!cockpitMode) {
      return;
    }
    setDraggingDeck(sectionId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', sectionId);
  };

  const handleDeckDragOver = (sectionId) => (event) => {
    if (!cockpitMode || !draggingDeck || draggingDeck === sectionId) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleToggleFeedback = () => {
    const next = toggleFeedback();
    if (next) {
      feedback('tap');
    }
  };

  const handleResetDeck = () => {
    setDeckOrder(DEFAULT_DECK_ORDER);
    feedback('refresh');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-violet-600 animate-spin" />
          <span className="text-sm font-medium">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate space-y-8 animate-fade-in pb-10 min-w-[1024px]">
      <MoneyWeatherBackdrop stats={summary.safe_to_spend_stats} />

      {/* Header & Actions */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, <span className="bg-linear-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">{user?.full_name || user?.email?.split('@')[0] || 'User'}</span>
          </h1>
          <p className="text-zinc-400 mt-1">{autopilotStatusText}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleFeedback}
            className={cn(
              'px-3 py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-2',
              feedbackEnabled
                ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/15'
                : 'bg-zinc-900/70 border-white/10 text-zinc-300 hover:bg-zinc-900'
            )}
          >
            {feedbackEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            Feedback
          </button>

          <button
            type="button"
            onClick={() => {
              setCockpitMode((prev) => !prev);
              feedback('tap');
            }}
            className={cn(
              'px-3 py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-2',
              cockpitMode
                ? 'bg-violet-500/15 border-violet-400/50 text-violet-200'
                : 'bg-zinc-900/70 border-white/10 text-zinc-300 hover:bg-zinc-900'
            )}
          >
            <LayoutDashboard size={14} />
            Layout Mode
          </button>

          {cockpitMode ? (
            <button
              type="button"
              onClick={handleResetDeck}
              className="px-3 py-2 rounded-xl border border-white/10 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-900 transition-colors text-xs font-semibold flex items-center gap-2"
            >
              <RotateCcw size={14} />
              Reset Deck
            </button>
          ) : null}

          <NotificationBell />
          <button
            onClick={() => navigate('/dashboard/transactions')}
            className="px-4 py-2 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10 text-sm"
          >
            <span>+ Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Row 1: Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Balance" 
          value={formatCurrency(summary.total_balance)}
          trend={summary.balance_change >= 0 ? 'up' : 'down'} 
          trendValue={`${Math.abs(summary.balance_change).toFixed(1)}%`} 
          icon={Wallet} 
          color="violet"
        />
        <StatsCard 
          title="Monthly Income" 
          value={formatCurrency(summary.monthly_income)}
          trend={summary.income_change >= 0 ? 'up' : 'down'} 
          trendValue={`${Math.abs(summary.income_change).toFixed(1)}%`} 
          icon={TrendingUp} 
          color="emerald"
        />
        <StatsCard 
          title="Monthly Expenses" 
          value={formatCurrency(summary.monthly_expenses)}
          trend={summary.expenses_change >= 0 ? 'up' : 'down'} 
          trendValue={`${Math.abs(summary.expenses_change).toFixed(1)}%`} 
          icon={ArrowUpRight} 
          color="rose"
        />
        <StatsCard 
          title="Total Savings" 
          value={formatCurrency(summary.total_savings)}
          trend="up" 
          trendValue="--" 
          icon={PiggyBank} 
          color="blue"
        />
      </div>

      {/* Row 2: Autopilot Core (Safe-to-Spend Orb & Money Flow) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <SafeToSpendOrb />
        </div>
        <div className="md:col-span-2">
          <MoneyFlow stats={summary.safe_to_spend_stats} />
        </div>
      </div>

      {deckOrder.map((sectionId) => {
        const section = deckSections[sectionId];
        if (!section) {
          return null;
        }

        return (
          <section
            key={sectionId}
            draggable={cockpitMode}
            onDragStart={handleDeckDragStart(sectionId)}
            onDragOver={handleDeckDragOver(sectionId)}
            onDrop={handleDeckDrop(sectionId)}
            onDragEnd={() => setDraggingDeck(null)}
            className={cn(
              'relative isolate z-10 transition-all duration-300',
              cockpitMode && 'rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-lg',
              cockpitMode && draggingDeck === sectionId && 'opacity-70 border-violet-400/50'
            )}
          >
            {cockpitMode ? (
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400 flex items-center gap-2">
                  <GripVertical size={14} className="text-violet-300" />
                  {section.title}
                </p>
                <span className="text-[11px] text-zinc-500">Drag to reorder dashboard decks</span>
              </div>
            ) : null}
            {section.content}
          </section>
        );
      })}
    </div>
  );
}
