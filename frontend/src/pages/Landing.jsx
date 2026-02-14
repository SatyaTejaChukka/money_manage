import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CircleCheckBig,
  Layers,
  Sparkles,
  Wallet,
} from 'lucide-react';

const problemBlocks = [
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Forgotten recurring payments',
    description:
      'Bills, subscriptions, and EMIs can slip through when they are tracked across multiple apps and reminders.',
  },
  {
    icon: <CalendarClock className="w-5 h-5" />,
    title: 'Unclear spendable balance',
    description:
      'Account balance alone does not show what is already committed to mandatory payments and savings goals.',
  },
  {
    icon: <Layers className="w-5 h-5" />,
    title: 'Manual monthly planning',
    description:
      'Without automation, salary split and monthly budget planning become repetitive and mentally draining.',
  },
];

const solutionBlocks = [
  {
    title: 'Safe-to-Spend Calculation',
    description:
      'Separates committed money from free money so you always know what is safe to spend now.',
  },
  {
    title: 'Salary Rule Engine',
    description:
      'Splits salary by priority into commitments, planned expenses, goals, and free money.',
  },
  {
    title: 'Money Autopilot Timeline',
    description:
      'Calendar-style view of past transactions, upcoming commitments, and projected balance events.',
  },
  {
    title: 'Stress Radar and Triage',
    description:
      'Shows money pressure signals and highlights the highest-priority actions to reduce financial stress.',
  },
];

const outcomes = [
  'Track income, expenses, bills, subscriptions, and goals in one system.',
  'See committed amount and safe-to-spend amount from real transaction data.',
  'Set category budgets and monitor usage with live progress updates.',
  'Review timeline events to plan upcoming payments before due dates.',
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/65 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold">WealthSync</span>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="border-zinc-700 hover:bg-zinc-800 text-white text-xs sm:text-sm px-3 sm:px-4"
            >
              Sign in
            </Button>
            <Button
              onClick={() => navigate('/signup')}
              className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm px-3 sm:px-4"
            >
              Create account
            </Button>
          </div>
        </div>
      </header>

      <section className="relative pt-30 sm:pt-34 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-full text-violet-300 text-xs sm:text-sm font-medium">
              <Wallet className="w-4 h-4" />
              Financial autopilot for low-stress money decisions
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Know your committed money.
              <br />
              <span className="bg-linear-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                Spend the rest confidently.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-300 mb-9 max-w-3xl leading-relaxed">
              WealthSync uses your real income, transactions, bills, subscriptions, and goals to calculate
              committed money, safe-to-spend money, and upcoming payment timelines.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Button
                onClick={() => navigate('/signup')}
                className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-2xl shadow-violet-500/20 px-8 py-6 text-lg font-semibold rounded-xl group"
              >
                Start autopilot
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="border-zinc-700 hover:bg-zinc-800 text-white px-8 py-6 text-lg rounded-xl"
              >
                Open dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {problemBlocks.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 text-violet-300 flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">How WealthSync works today</h2>
            <p className="text-zinc-400 text-lg max-w-3xl">
              Built around live user data and rule-based automation, not demo balances or static chart placeholders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {solutionBlocks.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 hover:border-violet-400/30 transition-colors"
              >
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto rounded-3xl border border-white/10 bg-zinc-900/40 p-8 sm:p-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">What you can do now</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {outcomes.map((outcome) => (
              <div key={outcome} className="flex items-start gap-3">
                <CircleCheckBig className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-zinc-300">{outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Start with your real financial data</h2>
          <p className="text-zinc-400 text-lg mb-8">
            Add your salary, commitments, and transactions to activate your financial autopilot dashboard.
          </p>
          <Button
            onClick={() => navigate('/signup')}
            className="bg-white text-black hover:bg-zinc-200 shadow-2xl shadow-white/20 px-10 py-6 text-lg font-bold rounded-xl"
          >
            Create free account
          </Button>
        </div>
      </section>

      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-linear-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">WealthSync</span>
          </div>
          <p className="text-zinc-500 text-sm">
            Copyright 2026 WealthSync. Built for financial clarity under pressure.
          </p>
        </div>
      </footer>
    </div>
  );
}
