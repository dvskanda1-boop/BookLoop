import React from 'react';
import { BookOpen, Sparkles, Heart, Shield, Code, Cpu } from 'lucide-react';

export const Footer = ({ setActivePage }) => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                BookLoop <span className="text-emerald-400">AI</span>
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              An intelligent, peer-to-peer campus book exchange platform powered by Google Gemini AI tool calling and FastAPI.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg w-fit">
              <Cpu className="w-3.5 h-3.5" />
              <span>Gemini 3.5 Flash-Lite Agent</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button onClick={() => setActivePage('marketplace')} className="hover:text-emerald-400 transition-colors">
                  Browse Marketplace
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('ai-assistant')} className="hover:text-emerald-400 transition-colors">
                  Conversational AI Assistant
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('marketplace')} className="hover:text-emerald-400 transition-colors">
                  Academic & Engineering Textbooks
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('wallet')} className="hover:text-emerald-400 transition-colors">
                  Campus Credit Wallet
                </button>
              </li>
            </ul>
          </div>

          {/* Academic Viva Highlights */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Architecture & Viva</h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                <span>FastAPI + SQLite Relational DB</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Gemini Automatic Tool Calling</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Escrow Credit Economics</span>
              </li>
              <li className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Zero-Waste College Sustainability</span>
              </li>
            </ul>
          </div>

          {/* Demo Credentials */}
          <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700/60">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 text-emerald-400">
              Demo Access Credentials
            </h4>
            <p className="text-[11px] text-stone-300 leading-tight mb-2">
              For faculty & project evaluators:
            </p>
            <div className="text-[11px] space-y-1 font-mono text-stone-300 bg-stone-900/80 p-2 rounded border border-stone-700">
              <div><strong className="text-stone-400">Admin:</strong> admin@bookloop.ai / Admin@123</div>
              <div><strong className="text-stone-400">Student:</strong> arjun@college.edu / Student@123</div>
            </div>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© 2026 BookLoop AI – Academic Final Year Engineering Project. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for campus students & sustainable learning.
          </p>
        </div>
      </div>
    </footer>
  );
};
