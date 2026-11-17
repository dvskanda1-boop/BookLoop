import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeftRight, CheckCircle2, XCircle, 
  Clock, Check, X, Coins, MessageSquare, AlertCircle 
} from 'lucide-react';

export const ExchangesPage = ({ onSuccess }) => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'outgoing'
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadExchanges = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.getIncomingExchanges(),
      api.getOutgoingExchanges()
    ])
      .then(([inc, out]) => {
        setIncoming(inc);
        setOutgoing(out);
      })
      .catch(err => setError(err.message || 'Failed to load exchange requests.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExchanges();
  }, []);

  const handleAccept = async (id) => {
    setActionLoadingId(id);
    try {
      await api.acceptExchange(id);
      loadExchanges();
      onSuccess('Exchange request accepted! The book is now reserved for the student.');
    } catch (err) {
      setError(err.message || 'Failed to accept exchange.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to decline this exchange? The student will be refunded their credits.')) {
      return;
    }
    setActionLoadingId(id);
    try {
      await api.rejectExchange(id);
      loadExchanges();
      onSuccess('Exchange request declined. Requester credits refunded.');
    } catch (err) {
      setError(err.message || 'Failed to reject exchange.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this exchange request? Your 2 credits will be returned to your wallet.')) {
      return;
    }
    setActionLoadingId(id);
    try {
      await api.cancelExchange(id);
      await refreshUser();
      loadExchanges();
      onSuccess('Exchange request cancelled. 2 credits refunded to your wallet.');
    } catch (err) {
      setError(err.message || 'Failed to cancel exchange.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('Confirm that the physical book handover has occurred on campus?')) {
      return;
    }
    setActionLoadingId(id);
    try {
      await api.completeExchange(id);
      await refreshUser();
      loadExchanges();
      onSuccess('Exchange completed successfully! +2 credits awarded to the book owner.');
    } catch (err) {
      setError(err.message || 'Failed to complete exchange.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const currentList = activeTab === 'incoming' ? incoming : outgoing;
  const pendingIncomingCount = incoming.filter(i => i.status === 'PENDING').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3 h-3" /> Awaiting Response</span>;
      case 'ACCEPTED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"><Check className="w-3 h-3" /> Accepted / Ready for Handover</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200"><XCircle className="w-3 h-3" /> Declined</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">Cancelled</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-stone-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Exchange Management & Handover
        </h1>
        <p className="text-xs text-stone-500 font-medium mt-1">
          Review incoming exchange offers on your books and track requests you sent to other students.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold text-rose-900 ml-4">Dismiss</button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-stone-200 gap-4">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'incoming'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Incoming Requests</span>
          {pendingIncomingCount > 0 && (
            <span className="text-[10px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded-full">
              {pendingIncomingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('outgoing')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'outgoing'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Outgoing Requests</span>
          <span className="text-[10px] bg-stone-200 text-stone-700 font-bold px-1.5 py-0.2 rounded-full">
            {outgoing.length}
          </span>
        </button>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-32 bg-stone-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : currentList.length > 0 ? (
        <div className="space-y-4">
          {currentList.map((req) => (
            <div
              key={req.id}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              
              {/* Left Column: Book & Participant Info */}
              <div className="flex items-start gap-4 flex-1">
                <img
                  src={req.requested_book?.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'}
                  alt={req.requested_book?.title}
                  className="w-14 h-20 object-cover rounded-xl border shadow-2xs shrink-0"
                />

                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-400 font-mono">REQ #{req.id}</span>
                    {getStatusBadge(req.status)}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {req.requested_book?.title || 'Book Title'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    by {req.requested_book?.author} ({req.requested_book?.condition})
                  </p>

                  <div className="pt-1 text-xs text-stone-600">
                    {activeTab === 'incoming' ? (
                      <span>Requested by <strong className="text-slate-900">{req.requester_name}</strong></span>
                    ) : (
                      <span>Owned by <strong className="text-slate-900">{req.owner_name}</strong> ({req.requested_book?.owner_location})</span>
                    )}
                  </div>

                  {req.notes && (
                    <div className="mt-2 text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100 flex items-start gap-1.5 italic">
                      <MessageSquare className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <span>"{req.notes}"</span>
                    </div>
                  )}

                  {req.offered_book && (
                    <div className="text-[11px] text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 w-fit font-medium">
                      Barter Offer: <strong>{req.offered_book.title}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Escrow Credits & Action Buttons */}
              <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                
                <div className="text-xs font-semibold text-stone-500 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span>2 Escrow Credits</span>
                </div>

                {/* Actions for Incoming Tab */}
                {activeTab === 'incoming' && (
                  <div className="flex items-center gap-2">
                    {req.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAccept(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Offer</span>
                        </button>
                      </>
                    )}

                    {req.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleComplete(req.id)}
                        disabled={actionLoadingId === req.id}
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Handover (+2 Credits)</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Actions for Outgoing Tab */}
                {activeTab === 'outgoing' && (
                  <div className="flex items-center gap-2">
                    {req.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(req.id)}
                        disabled={actionLoadingId === req.id}
                        className="px-3.5 py-2 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                      >
                        Cancel Request
                      </button>
                    )}

                    {req.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleComplete(req.id)}
                        disabled={actionLoadingId === req.id}
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Handover Complete</span>
                      </button>
                    )}
                  </div>
                )}

              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No {activeTab === 'incoming' ? 'incoming offers' : 'outgoing requests'}
          </h3>
          <p className="text-xs text-stone-500">
            {activeTab === 'incoming'
              ? 'When another student wants to exchange one of your listed books, their request will appear here.'
              : 'Browse the marketplace to find books you want and request an exchange using your credits.'}
          </p>
        </div>
      )}

    </div>
  );
};
