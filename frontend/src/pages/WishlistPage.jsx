import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, ArrowRight, BookOpen, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BookCard } from '../components/BookCard';

export const WishlistPage = ({ onSelectBook, onExploreMarketplace }) => {
  const { wishlistCount, refreshWishlist, toggleWishlist, addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadWishlist();
  }, [isAuthenticated]);

  const loadWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getWishlist();
      setItems(data);
    } catch (err) {
      setError(err.message || 'Could not load your saved wishlist.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (bookId) => {
    try {
      await toggleWishlist(bookId);
      setItems(prev => prev.filter(item => item.book_id !== bookId));
    } catch (err) {
      alert(err.message || 'Could not remove item');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fade-in">
        <Heart className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-2xl font-black text-stone-900 mb-2">Sign In to View Your Wishlist</h2>
        <p className="text-xs text-stone-500 mb-6">Save pre-owned books you love and track price drops.</p>
        <button
          onClick={onExploreMarketplace}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
        >
          Explore Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2.5">
            <Heart className="w-7 h-7 text-rose-600 fill-rose-600" />
            <span>Saved Wishlist ({items.length})</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Keep track of second-hand books you plan to read next.
          </p>
        </div>

        <button
          onClick={onExploreMarketplace}
          className="text-xs font-bold text-stone-600 hover:text-emerald-700 inline-flex items-center gap-1"
        >
          <span>Find More Books</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-stone-500">Loading wishlist...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-xs text-rose-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center bg-stone-50 rounded-3xl border border-stone-200 p-8">
          <Heart className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900">Your wishlist is empty</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto mb-6">
            Click the heart icon on any pre-owned book card to save it here for later.
          </p>
          <button
            onClick={onExploreMarketplace}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
          >
            Browse Pre-Owned Books
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => item.book && (
            <div key={item.id} className="relative group">
              <BookCard
                book={item.book}
                onSelect={(b) => onSelectBook && onSelectBook(b.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
