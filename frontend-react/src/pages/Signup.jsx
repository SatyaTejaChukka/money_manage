import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Alert } from '../components/ui/Alert.jsx';
import { TrendingUp, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/signup', { email, password });
      navigate('/login');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-violet-600/20 rounded-full mix-blend-screen filter blur-3xl animate-pulse" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full mix-blend-screen filter blur-3xl animate-pulse delay-500" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fadeIn">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
              <TrendingUp className="text-white" size={24} />
            </div>
            <span className="text-3xl font-bold bg-linear-to-r from-white to-zinc-300 bg-clip-text text-transparent">MoneyOS</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-zinc-400">Start managing your finances</p>
        </div>

        {/* Glassmorphism card with gradient border */}
        <div className="relative group">
          {/* Gradient border effect */}
          <div className="absolute -inset-0.5 bg-linear-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          
          {/* Main card */}
          <div className="relative bg-zinc-900/70 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-10 border border-zinc-800/50 animate-fadeIn">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <Alert type="error" message={error} onClose={() => setError('')} />}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-zinc-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="pl-12 bg-zinc-800/50 backdrop-blur-sm border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-zinc-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-12 bg-zinc-800/50 backdrop-blur-sm border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-zinc-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-12 bg-zinc-800/50 backdrop-blur-sm border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                fullWidth
                isLoading={isLoading}
                icon={<ArrowRight size={20} />}
                iconPosition="right"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-400">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-6">By continuing, you agree to our Terms and Privacy Policy</p>
      </div>
    </div>
  );
}
