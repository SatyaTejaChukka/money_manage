import React, { useEffect, useState } from 'react';
import { StatsCard } from '../../components/dashboard/StatsCard.jsx';
import { FinancialHealthScore } from '../../components/dashboard/FinancialHealthScore.jsx';
import { SpendingChart } from '../../components/dashboard/SpendingChart.jsx';
import { RecentActivity } from '../../components/dashboard/RecentActivity.jsx';
import { InsightsPanel } from '../../components/dashboard/InsightsPanel.jsx';
import { Wallet, TrendingUp, PiggyBank, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';
import { dashboardService } from '../../services/dashboard.js';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chartRange, setChartRange] = useState('week');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
        try {
            setIsLoading(true);
            const stats = await dashboardService.getSummary(chartRange);
            setData(stats);
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchDashboard();
  }, [chartRange]);

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

  // Safe defaults if data is missing or empty
  const summary = data || {
      total_balance: 0,
      balance_change: 0,
      monthly_income: 0,
      monthly_expenses: 0,
      income_change: 0,
      expenses_change: 0,
      total_savings: 0,
      health_score: { score: 0, message: "No data", color: "blue" },
      recent_transactions: [],
      spending_chart: []
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, <span className="bg-linear-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">{user?.full_name || user?.email?.split('@')[0] || 'User'}</span>
          </h1>
          <p className="text-zinc-400 mt-1">Here's what's happening with your finance today.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => navigate('/dashboard/transactions')} // Placeholder action
             className="px-4 py-2 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10 text-sm"
           >
            Add Transaction
           </button>
           <button
             onClick={() => navigate('/dashboard/analytics')}
             className="px-4 py-2 bg-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-700 transition-colors border border-zinc-700 text-sm"
           >
            View Reports
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Balance" 
          value={`$${summary.total_balance}`} 
          trend={summary.balance_change >= 0 ? 'up' : 'down'} 
          trendValue={`${Math.abs(summary.balance_change).toFixed(1)}%`} 
          icon={Wallet} 
          color="violet"
        />
        <StatsCard 
          title="Monthly Income" 
          value={`$${summary.monthly_income}`} 
          trend={summary.income_change >= 0 ? 'up' : 'down'} 
          trendValue={`${Math.abs(summary.income_change).toFixed(1)}%`} 
          icon={TrendingUp} 
          color="emerald"
        />
        <StatsCard 
          title="Monthly Expenses" 
          value={`$${summary.monthly_expenses}`} 
          trend={summary.expenses_change >= 0 ? 'up' : 'down'} 
          trendValue={`${Math.abs(summary.expenses_change).toFixed(1)}%`} 
          icon={ArrowUpRight} 
          color="rose"
        />
        <StatsCard 
          title="Total Savings" 
          value={`$${summary.total_savings}`} 
          trend="up" 
          trendValue="--" 
          icon={PiggyBank} 
          color="blue"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[400px]">
          <SpendingChart 
            data={summary.spending_chart} 
            range={chartRange}
            onRangeChange={setChartRange}
          />
        </div>
        <div className="lg:col-span-1 h-[400px]">
          <FinancialHealthScore 
            score={summary.health_score.score} 
            message={summary.health_score.message}
            color={summary.health_score.color}
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2">
            <RecentActivity transactions={summary.recent_transactions} />
         </div>
         <div className="lg:col-span-1">
            <div className="h-full">
                <InsightsPanel insights={summary.health_score.insights || []} />
            </div>
         </div>
      </div>
    </div>
  );
}
