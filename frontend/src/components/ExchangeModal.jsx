import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { 
  X, ArrowLeftRight, Coins, AlertCircle, 
  CheckCircle2, BookOpen, MessageSquare 
} from 'lucide-react';

export const ExchangeModal = ({ book, onClose, onSuccess, setActivePage }) => {
  const { user, refreshUser } = useAuth();
  const [myBooks, setMyBooks] = useState([]);
  const [selectedOfferedBook, setSelectedOfferedBook] = useState('');
  const [notes, setNotes] = useState('Hi! I would love to exchange and read this book on campus.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      api.getMyBookshelf()
        .then(res => setMyBooks(res.filter(b => b.is_available)))
        .catch(err => console.warn('Could not fetch bookshelf:', err));
    }
  }, [user]);

  if (!book) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-xl border border-stone-200">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Coins className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Sign in to Exchange Books</h3>
          <p className="text-xs text-stone-600">
            You must be logged into BookLoop AI to initiate exchange requests and spend credits.
          </p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-xs font-semibold text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                setActivePage('login');
              }}
              className="flex-1 py-2 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
            >
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasEnoughCredits = user.credit_balance >= 2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasEnoughCredits) return;

    setSubmitting(true);
    setError(null);

    try {
      await api.createExchange({
        requested_book_id: book.id,
        offered_book_id: selectedOfferedBook ? parseInt(selectedOfferedBook) : null,
        notes: notes.trim()
      });
      await refreshUser();
      onSuccess(`Exchange request for "${book.title}" sent successfully! 2 credits placed in escrow.`);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit exchange request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2 text-emerald-800">
            <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Initiate Book Exchange</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Book Summary */}
        <div className="flex gap-4 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/70 items-center">
          <img
            src={book.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'}
            alt={book.title}
            className="w-14 h-18 object-cover rounded-lg border shadow-2xs"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{book.category_name}</span>
            <h4 className="text-sm font-bold text-slate-900 truncate">{book.title}</h4>
            <p className="text-xs text-stone-500 truncate">by {book.author}</p>
            <p className="text-[11px] text-stone-600 mt-1">Owner: <strong>{book.owner_name}</strong> ({book.owner_location})</p>
          </div>
        </div>

        {/* Credit Breakdown Box */}
        <div className={`p-4 rounded-2xl border text-xs space-y-2 ${hasEnoughCredits ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
          <div className="flex justify-between items-center font-semibold">
            <span>Exchange Escrow Fee:</span>
            <span className="font-bold text-amber-800 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-600" /> 2 Credits
            </span>
          </div>
          <div className="flex justify-between items-center text-stone-600">
            <span>Your Current Balance:</span>
            <span className="font-bold">{user.credit_balance} Credits</span>
          </div>
          <div className="flex justify-between items-center font-bold pt-1.5 border-t border-emerald-200/60">
            <span>Balance After Request:</span>
            <span>{hasEnoughCredits ? `${user.credit_balance - 2} Credits` : 'Insufficient Credits'}</span>
          </div>
        </div>

        {!hasEnoughCredits && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">You need at least 2 credits.</p>
              <p className="text-[11px] mt-0.5">List your own books on your bookshelf to earn credits when other students exchange with you!</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Optional Direct Book Barter */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Offer a Book in Return (Optional Barter)
            </label>
            <select
              value={selectedOfferedBook}
              onChange={(e) => setSelectedOfferedBook(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
            >
              <option value="">No specific book (Use 2 credits only)</option>
              {myBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.condition})
                </option>
              ))}
            </select>
          </div>

          {/* Notes / Message */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Message to Book Owner
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Can meet after 4 PM at the library..."
              className="w-full text-xs px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasEnoughCredits || submitting}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <span>Confirming...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Send Request (2 Credits)</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
