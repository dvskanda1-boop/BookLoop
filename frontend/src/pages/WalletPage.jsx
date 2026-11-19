import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Coins, ArrowUpRight, ArrowDownLeft, ShieldCheck, 
  RotateCcw, Sparkles, CreditCard, RefreshCw 
} from 'lucide-react';

export const WalletPage = () => {
  const { user } = useAuth();
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadWallet = () => {
    setLoading(true);
    api.getCreditBalance()
      .then(res => setBalanceData(res))
      .catch(err => console.warn('Could not load wallet:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const getTxTypeBadge = (type) => {
    switch (type) {
      case 'INITIAL_BONUS':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Welcome Bonus</span>;
      case 'EXCHANGE_EARNED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">Exchange Earned</span>;
      case 'EXCHANGE_SPENT':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">Escrow Spent</span>;
      case 'EXCHANGE_REFUND':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">Refund</span>;
      case 'ADMIN_ADJUSTMENT':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">Admin Adjustment</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">{type}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="border-b border-stone-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Campus Exchange Credit Wallet
        </h1>
        <p className="text-xs text-stone-500 font-medium mt-1">
          Track your tokenized book exchange credits, escrow holdings, and verified transaction history.
        </p>
      </div>

      {/* Top Section: Digital Credit Card + Economics Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Digital Wallet Card */}
        <div className="md:col-span-6">
          <div className="relative aspect-[1.6/1] rounded-3xl bg-gradient-to-tr from-emerald-950 via-teal-900 to-stone-900 p-6 sm:p-7 text-white shadow-2xl flex flex-col justify-between overflow-hidden border border-emerald-500/30">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>

            {/* Top Row: Brand & Chip */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-emerald-300" />
                </div>
                <span className="text-xs font-bold tracking-wider uppercase text-emerald-200">BookLoop Pass</span>
              </div>
              <div className="w-10 h-7 rounded-md bg-amber-400/20 border border-amber-300/40 flex items-center justify-center">
                <div className="w-6 h-4 border border-amber-300/60 rounded-xs"></div>
              </div>
            </div>

            {/* Center: Balance */}
            <div>
              <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block mb-0.5">
                Available Exchange Balance
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-baseline gap-2">
                <span>{balanceData?.credit_balance ?? user?.credit_balance ?? 10}</span>
                <span className="text-sm font-bold text-emerald-400 uppercase tracking-normal">Credits</span>
              </div>
            </div>

            {/* Bottom Row: User name & College */}
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
              <div>
                <span className="text-[9px] text-stone-400 uppercase block tracking-wider">Member</span>
                <span className="font-bold tracking-wide truncate max-w-[180px] block">{user?.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-stone-400 uppercase block tracking-wider">Institution</span>
                <span className="font-semibold text-emerald-300 text-[11px] truncate max-w-[140px] block">{user?.college}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Economics Rules Box */}
        <div className="md:col-span-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Credit System Rules & Anti-Fraud Logic
          </h3>
          <ul className="space-y-3 text-xs text-stone-600">
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                10
              </div>
              <p>
                <strong>Welcome Bonus:</strong> Every verified college student automatically receives 10 credits upon registration.
              </p>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                -2
              </div>
              <p>
                <strong>Escrow Deduction:</strong> Requesting a book temporarily holds 2 credits in escrow so students commit to exchanges.
              </p>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                +2
              </div>
              <p>
                <strong>Exchange Reward:</strong> When the physical book handover is verified on campus, the owner earns +2 credits!
              </p>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                ↺
              </div>
              <p>
                <strong>Guaranteed Refunds:</strong> If an owner declines or an exchange is cancelled, the 2 escrow credits return to your wallet immediately.
              </p>
            </li>
          </ul>
        </div>

      </div>

      {/* Audit Trail Transaction History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            Transaction Audit Trail
          </h3>
          <span className="text-xs text-stone-500 font-medium">
            Immutable database records
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-14 bg-stone-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : Array.isArray(balanceData?.transactions) && balanceData.transactions.length > 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Transaction Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {balanceData.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 text-stone-500 text-[11px] whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {tx.description}
                      </td>
                      <td className="py-3 px-4">
                        {getTxTypeBadge(tx.transaction_type)}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold font-mono ${tx.amount > 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Credits
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-stone-700 font-mono">
                        {tx.balance_after}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl text-center border border-stone-200 text-xs text-stone-500">
            No transactions found.
          </div>
        )}
      </div>

    </div>
  );
};
