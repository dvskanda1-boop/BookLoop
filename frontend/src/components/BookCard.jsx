import React from 'react';
import { 
  Heart, MapPin, Truck, Sparkles, Tag, ShoppingCart, 
  ArrowRight, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const BookCard = ({ book, onSelect, onQuickBuy }) => {
  const { addToCart, isBookWishlisted, toggleWishlist, buyerPincode } = useCart();
  const { isAuthenticated } = useAuth();
  const wishlisted = isBookWishlisted(book.id);

  const handleWishlistClick = async (e) => {
    e.stopPropagation();
    try {
      await toggleWishlist(book.id);
    } catch (err) {
      alert(err.message || 'Please log in to add to wishlist');
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    const res = addToCart(book);
    if (!res.success) {
      alert(res.message);
    }
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    if (onQuickBuy) {
      onQuickBuy(book);
    } else if (onSelect) {
      onSelect(book);
    }
  };

  const conditionColors = {
    'Like New': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Very Good': 'bg-teal-50 text-teal-800 border-teal-200',
    'Good': 'bg-blue-50 text-blue-800 border-blue-200',
    'Acceptable': 'bg-amber-50 text-amber-900 border-amber-200'
  };

  const savings = Math.max(0, (book.original_price || 0) - (book.selling_price || 0));

  return (
    <div 
      onClick={() => onSelect && onSelect(book)}
      className="group relative bg-white rounded-2xl border border-stone-200 hover:border-emerald-500/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Top Badges */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Discount Badge */}
        {book.discount_percent > 0 ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-md flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {Math.round(book.discount_percent)}% OFF
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-sm">
            Pre-Owned
          </span>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          className={`pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
            wishlisted 
              ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:scale-110' 
              : 'bg-white/90 hover:bg-white text-stone-400 hover:text-rose-500 hover:scale-110 backdrop-blur-xs'
          }`}
          title={wishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
        </button>
      </div>

      {/* Book Cover Image */}
      <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
        <img
          src={book.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400';
          }}
        />
        
        {/* Condition Ribbon */}
        <div className="absolute bottom-2 left-2">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border shadow-xs ${conditionColors[book.condition] || 'bg-stone-100 text-stone-800 border-stone-200'}`}>
            {book.condition}
          </span>
        </div>

        {/* Sold Overlay */}
        {book.is_sold && (
          <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-rose-600 text-white font-extrabold uppercase tracking-widest text-sm px-4 py-1.5 rounded-full shadow-lg">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Book Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1 truncate">
            {book.category_name || 'General Reading'}
          </div>

          {/* Title */}
          <h3 className="font-bold text-stone-900 line-clamp-1 group-hover:text-emerald-700 transition-colors text-base" title={book.title}>
            {book.title}
          </h3>

          {/* Author */}
          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
            by <span className="text-stone-700 font-medium">{book.author}</span>
          </p>

          {/* Price & Savings Block */}
          <div className="mt-3 pt-2.5 border-t border-stone-100">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-stone-900 tracking-tight">
                ₹{Math.round(book.selling_price)}
              </span>
              {book.original_price > book.selling_price && (
                <span className="text-xs text-stone-400 line-through">
                  MRP ₹{Math.round(book.original_price)}
                </span>
              )}
            </div>

            {savings > 0 && (
              <p className="text-[11px] font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>You Save ₹{Math.round(savings)}</span>
              </p>
            )}
          </div>

          {/* Location & Estimated Distance Info */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-500">
            <div className="flex items-center gap-1 truncate max-w-[65%]" title={`Seller in ${book.pickup_city || 'Bengaluru'}`}>
              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
              <span className="truncate">{book.pickup_city || 'Bengaluru'} ({book.pickup_pincode || '560001'})</span>
            </div>

            <div className="flex items-center gap-1 text-teal-700 font-medium shrink-0">
              <Truck className="w-3 h-3" />
              <span>Standard Post</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
          {!book.is_sold ? (
            <>
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-2 px-2.5 rounded-xl border border-stone-300 hover:border-emerald-600 bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                title="Add to Cart"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-stone-500 hover:text-emerald-700" />
                <span>Cart</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm hover:shadow-md"
              >
                <span>Buy Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              disabled
              className="w-full py-2 px-3 rounded-xl bg-stone-100 text-stone-400 text-xs font-semibold cursor-not-allowed text-center"
            >
              Copy Sold Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
