import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { 
  Wallet, TrendingUp, Target, Bell, PieChart, Shield,
  Zap, BarChart3, Clock, CheckCircle2, ArrowRight, Sparkles
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Smart Budgeting",
      description: "Set intelligent budgets per category with real-time tracking and alerts"
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Bill Automation",
      description: "Never miss a payment with automated reminders and pending transactions"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Savings Goals",
      description: "Set financial goals and track your progress with visual milestones"
    },
    {
      icon: <PieChart className="w-6 h-6" />,
      title: "Deep Analytics",
      description: "Beautiful charts and insights to understand your spending patterns"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Financial Health",
      description: "AI-powered score and personalized recommendations for better finances"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Sync",
      description: "All your data synced across devices instantly and securely"
    }
  ];

  const benefits = [
    "Automated bill tracking & reminders",
    "Category-based budget management",
    "Savings goals with progress tracking",
    "Smart financial insights & AI recommendations",
    "Beautiful charts & analytics",
    "Recurring subscription tracking"
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">MoneyOS</span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="border-zinc-700 hover:bg-zinc-800 text-white"
            >
              Sign in
            </Button>
            <Button
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/30"
            >
              Create account
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-sm font-medium backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              Your Financial Command Center
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-violet-200 to-indigo-300 bg-clip-text text-transparent">
                Simple personal
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                finance tracking.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Track income, spending, budgets, goals, and subscriptions with{' '}
              <span className="text-violet-400 font-semibold">automated reminders</span>.{' '}
              No fake marketing, just a powerful product.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-2xl shadow-violet-500/30 px-8 py-6 text-lg font-semibold rounded-xl group"
              >
                Get started free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="border-zinc-700 hover:bg-zinc-800 text-white px-8 py-6 text-lg rounded-xl"
              >
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Everything you need
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Powerful features to take control of your finances
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-violet-500/30 transition-all duration-300 hover:scale-105"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-linear-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                Take charge of your money
              </h2>
              <p className="text-xl text-zinc-400 mb-8 leading-relaxed">
                MoneyOS gives you the tools to understand where your money goes, set meaningful goals, and build better financial habits.
              </p>
              <Button
                onClick={() => navigate('/signup')}
                className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xl shadow-violet-500/20 px-8 py-4 text-lg rounded-xl"
              >
                Start tracking today
              </Button>
            </div>
            <div className="space-y-4">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900/70 transition-colors">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-linear-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 backdrop-blur-xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
              Ready to get started?
            </h2>
            <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are taking control of their finances with MoneyOS
            </p>
            <Button
              onClick={() => navigate('/signup')}
              className="bg-white text-black hover:bg-zinc-200 shadow-2xl shadow-white/20 px-10 py-6 text-lg font-bold rounded-xl"
            >
              Create your free account
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-linear-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-white to-zinc-300 bg-clip-text text-transparent">MoneyOS</span>
          </div>
          <p className="text-zinc-500 text-sm">
            © 2026 MoneyOS. Your financial command center.
          </p>
        </div>
      </footer>
    </div>
  );
}
