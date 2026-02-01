import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../lib/auth.jsx';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-lg">
              <TrendingUp className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold gradient-text">MoneyOS</span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="gradient" size="sm">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="gradient" size="sm">
                    Create account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Simple personal finance tracking.
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Track income, spending, budgets, goals, and subscriptions. No fake marketing, just the product.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="gradient" size="lg">
                  Open dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button variant="gradient" size="lg">
                    Get started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Sign in
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
