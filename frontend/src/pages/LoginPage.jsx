import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const LoginPage = ({ setActivePage, onSuccess }) => {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      onSuccess(`Welcome back, ${user.name}!`);
      setActivePage('marketplace');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError(null);
    try {
      const user = await quickLogin(demoEmail, demoPassword);
      onSuccess(`Logged in as ${user.name}!`);
      setActivePage('marketplace');
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-md">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome to BookLoop AI
        </h1>
        <p className="text-xs text-stone-500">
          Sign in to access your Bookshelf, exchange requests, and credits.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="bg-white p-7 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
            College Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. arjun@college.edu"
              className="w-full text-xs pl-10 pr-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs pl-10 pr-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
        >
          <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="text-center pt-2">
          <span className="text-xs text-stone-500">
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={() => setActivePage('register')}
              className="font-bold text-emerald-700 hover:underline"
            >
              Register here (Earn 10 credits)
            </button>
          </span>
        </div>
      </form>

      {/* Demo Viva Evaluator Quick-Fill Box */}
      <div className="bg-stone-100/70 p-5 rounded-3xl border border-stone-200/80 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 uppercase tracking-wider">
          <UserCheck className="w-4 h-4 text-emerald-700" />
          <span>Demo Evaluator 1-Click Login</span>
        </div>
        <p className="text-[11px] text-stone-500">
          Click any persona below to evaluate BookLoop AI without typing:
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuick('arjun@college.edu', 'Student@123')}
            className="p-2.5 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 rounded-xl text-left transition-all shadow-2xs group"
          >
            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">Arjun Sharma</div>
            <div className="text-[10px] text-stone-500">Computer Science (14 Cr)</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuick('priya@college.edu', 'Student@123')}
            className="p-2.5 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 rounded-xl text-left transition-all shadow-2xs group"
          >
            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">Priya Patel</div>
            <div className="text-[10px] text-stone-500">Data Science (18 Cr)</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuick('rohit@college.edu', 'Student@123')}
            className="p-2.5 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 rounded-xl text-left transition-all shadow-2xs group"
          >
            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">Rohit Kumar</div>
            <div className="text-[10px] text-stone-500">Day Scholar (10 Cr)</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuick('admin@bookloop.ai', 'Admin@123')}
            className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-left transition-all shadow-2xs group"
          >
            <div className="text-xs font-bold text-purple-900">Administrator</div>
            <div className="text-[10px] text-purple-600">Admin Command Hub</div>
          </button>
        </div>
      </div>

    </div>
  );
};
