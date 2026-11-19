import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, PlusCircle, Trash2, Eye, EyeOff, 
  BookOpen, CheckCircle2, AlertCircle, RefreshCw 
} from 'lucide-react';

export const BookshelfPage = ({ setActivePage, setSelectedBook, onSuccess }) => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);

  const loadBookshelf = () => {
    setLoading(true);
    setActionError(null);
    api.getMyBookshelf()
      .then(res => setBooks(Array.isArray(res) ? res : (res?.books || [])))
      .catch(err => setActionError(err.message || 'Could not load bookshelf.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookshelf();
  }, []);

  const handleToggleAvailability = async (book) => {
    try {
      await api.updateBook(book.id, { is_available: !book.is_available });
      loadBookshelf();
      onSuccess(`"${book.title}" availability updated to ${!book.is_available ? 'Available' : 'Paused'}.`);
    } catch (err) {
      setActionError(err.message || 'Could not update availability.');
    }
  };

  const handleDeleteBook = async (book) => {
    if (!window.confirm(`Are you sure you want to remove "${book.title}" from your bookshelf?`)) {
      return;
    }
    try {
      await api.deleteBook(book.id);
      loadBookshelf();
      onSuccess(`"${book.title}" was removed from your bookshelf.`);
    } catch (err) {
      setActionError(err.message || 'Could not delete book. Active exchanges may exist.');
    }
  };

  const totalExchanged = books.reduce((acc, b) => acc + (b.exchange_count || 0), 0);
  const availableCount = books.filter(b => b.is_available).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Bookshelf
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-1">
            Manage your personal library listings and toggle campus exchange availability.
          </p>
        </div>

        <button
          onClick={() => setActivePage('add-book')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>List a New Book</span>
        </button>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-xs font-bold text-rose-900 ml-4">Dismiss</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Total Books Listed</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{books.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Available for Exchange</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{availableCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Completed Exchanges</span>
          <div className="text-2xl font-extrabold text-teal-800 mt-1">{totalExchanged}</div>
        </div>
      </div>

      {/* Books Table / Grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-20 bg-stone-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-4">Book Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Condition</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Exchanged</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {books.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'}
                          alt={b.title}
                          className="w-10 h-13 object-cover rounded-md border shadow-2xs shrink-0"
                        />
                        <div className="min-w-0">
                          <button
                            onClick={() => setSelectedBook(b)}
                            className="font-bold text-slate-900 hover:text-emerald-700 text-left line-clamp-1 cursor-pointer"
                          >
                            {b.title}
                          </button>
                          <span className="text-stone-500 text-[11px] block">by {b.author}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-medium">
                      {b.category_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-200">
                        {b.condition}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {b.is_available ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                          Paused
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-700">
                      {b.exchange_count || 0} times
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleAvailability(b)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                          title={b.is_available ? "Pause exchange listing" : "Make available"}
                        >
                          {b.is_available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                        </button>
                        <button
                          onClick={() => handleDeleteBook(b)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete book"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Your Bookshelf is empty</h3>
          <p className="text-xs text-stone-500">
            List textbooks, fiction, or guides that you've finished reading. When other students exchange with you, you earn credits!
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActivePage('add-book')}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
            >
              List Your First Book
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
