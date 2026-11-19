import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, Users, BookOpen, Truck, Package, 
  Coins, CheckCircle2, AlertTriangle, RefreshCw, Plus, 
  DollarSign, Settings, Save 
} from 'lucide-react';

export const AdminPage = ({ onSuccess }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [deliveryRules, setDeliveryRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Credit adjustment form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState(5);
  const [adjustReason, setAdjustReason] = useState('College Book Drive Reward');
  const [adjusting, setAdjusting] = useState(false);

  // Delivery Rules Form State
  const [baseFee, setBaseFee] = useState(35);
  const [perKmRate, setPerKmRate] = useState(1.8);
  const [per250gRate, setPer250gRate] = useState(5.0);
  const [freeThreshold, setFreeThreshold] = useState(800);
  const [savingRules, setSavingRules] = useState(false);

  const loadAdminData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.getStats(),
      api.getAllUsers(),
      api.getAllOrders(),
      api.getDeliveryRules()
    ])
      .then(([s, u, ords, rules]) => {
        const safeUsers = Array.isArray(u) ? u : (u?.users || []);
        const safeOrders = Array.isArray(ords) ? ords : (ords?.orders || []);
        setStats(s || {});
        setUsersList(safeUsers);
        setOrdersList(safeOrders);
        setDeliveryRules(rules);
        if (rules) {
          setBaseFee(rules.base_fee);
          setPerKmRate(rules.per_km_rate);
          setPer250gRate(rules.per_250g_rate);
          setFreeThreshold(rules.free_delivery_threshold);
        }
        if (safeUsers.length > 0 && !selectedUserId) {
          setSelectedUserId(safeUsers[0].id);
        }
      })
      .catch(err => setError(err.message || 'Failed to load admin stats.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleAdjustCredits = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setAdjusting(true);
    try {
      await api.adjustCredits(parseInt(selectedUserId), parseInt(adjustAmount), adjustReason);
      loadAdminData();
      if (onSuccess) onSuccess(`Successfully adjusted ${adjustAmount} credits for user #${selectedUserId}!`);
    } catch (err) {
      setError(err.message || 'Failed to adjust credits.');
    } finally {
      setAdjusting(false);
    }
  };

  const handleSaveDeliveryRules = async (e) => {
    e.preventDefault();
    setSavingRules(true);
    try {
      await api.updateDeliveryRules({
        base_fee: parseFloat(baseFee),
        per_km_rate: parseFloat(perKmRate),
        per_250g_rate: parseFloat(per250gRate),
        free_delivery_threshold: parseFloat(freeThreshold)
      });
      alert('Delivery courier rates updated successfully!');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to save delivery rules.');
    } finally {
      setSavingRules(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
      
      {/* Header */}
      <div className="border-b border-stone-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-purple-100 text-purple-800">
              <ShieldCheck className="w-5 h-5 text-purple-700" />
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Administrative Command Hub
            </h1>
          </div>
          <p className="text-xs text-stone-500 font-medium mt-1">
            Platform moderation, GMV metrics, delivery rate rules editor, and order tracking.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Registered Users</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.total_users ?? 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total GMV (INR)</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">₹{Math.round(stats?.total_gmv_inr ?? 0)}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">Orders Placed</span>
          <div className="text-2xl font-black text-teal-800 mt-1">{stats?.total_orders ?? 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Active Books</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.available_books ?? 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Sold Copies</span>
          <div className="text-2xl font-black text-rose-700 mt-1">{stats?.sold_books ?? 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Active Credits</span>
          <div className="text-2xl font-black text-amber-800 mt-1">{stats?.total_credits_circulating ?? 0}</div>
        </div>
      </div>

      {/* Row 2: Delivery Courier Rates Editor & Credit Adjustment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Delivery Rates Rule Editor (6 cols) */}
        <form onSubmit={handleSaveDeliveryRules} className="lg:col-span-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-100">
            <Truck className="w-4 h-4 text-teal-600" />
            <span>Courier Delivery Rates Configuration</span>
          </h3>
          <p className="text-xs text-stone-500">
            Configure logistics pricing rules applied when calculating courier shipping distance across Indian PIN codes.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Base Delivery Fee (₹)</label>
              <input
                type="number"
                step="0.5"
                required
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Per-KM Rate (₹/km)</label>
              <input
                type="number"
                step="0.1"
                required
                value={perKmRate}
                onChange={(e) => setPerKmRate(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Weight Surcharge (₹/250g)</label>
              <input
                type="number"
                step="0.5"
                required
                value={per250gRate}
                onChange={(e) => setPer250gRate(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Free Shipping Order Min (₹)</label>
              <input
                type="number"
                required
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingRules}
            className="w-full py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{savingRules ? 'Updating Rates...' : 'Save Courier Rates'}</span>
          </button>
        </form>

        {/* Credit Tool (6 cols) */}
        <form onSubmit={handleAdjustCredits} className="lg:col-span-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-100">
            <Coins className="w-4 h-4 text-amber-600" />
            <span>Credit Adjustment Tool (Viva / Testing)</span>
          </h3>
          <p className="text-xs text-stone-500">
            Grant or audit credits for campus book drive donations and student rewards.
          </p>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Target Student</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
            >
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) — Balance: {u.credit_balance}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Amount to Add</label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(parseInt(e.target.value))}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Audit Reason</label>
              <input
                type="text"
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={adjusting}
            className="w-full py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{adjusting ? 'Adjusting...' : 'Execute Credit Adjustment'}</span>
          </button>
        </form>

      </div>

      {/* Row 3: All Marketplace Orders Across Platform */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-emerald-700" />
            <span>All Marketplace Orders ({ordersList.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Book Title</th>
                <th className="py-3 px-4">Buyer & City</th>
                <th className="py-3 px-4">Seller</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {ordersList.map((o) => (
                <tr key={o.id} className="hover:bg-stone-50/50">
                  <td className="py-2.5 px-4 font-mono font-bold text-stone-900">{o.order_number}</td>
                  <td className="py-2.5 px-4 font-medium text-stone-800">{o.book_title}</td>
                  <td className="py-2.5 px-4 text-stone-600">{o.recipient_name} ({o.buyer_city}, {o.buyer_pincode})</td>
                  <td className="py-2.5 px-4 text-stone-600">{o.seller_name}</td>
                  <td className="py-2.5 px-4 font-bold text-emerald-700 font-mono">₹{Math.round(o.total_amount)}</td>
                  <td className="py-2.5 px-4">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Registered Users */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-700" />
            <span>Registered Campus Users ({usersList.length})</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50/50">
                  <td className="py-2.5 px-4">
                    <div className="font-bold text-slate-900">{u.name}</div>
                    <div className="text-[11px] text-stone-400 font-mono">{u.email}</div>
                  </td>
                  <td className="py-2.5 px-4">
                    {u.is_admin ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Admin</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">Student</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-stone-500 text-[11px] truncate max-w-[150px]">
                    {u.location}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-700 font-mono">
                    {u.credit_balance} Credits
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
