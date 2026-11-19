import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Heart, ShoppingCart, Truck, ShieldCheck, 
  MapPin, CheckCircle2, AlertCircle, Sparkles, Star, 
  Share2, Tag, Calendar, BookOpen, Layers, Weight, Info
} from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BookCard } from './BookCard';

export const ProductDetailPage = ({ bookId, onBack, onSelectBook, onBuyNow, onAskAI }) => {
  const { addToCart, isBookWishlisted, toggleWishlist, buyerPincode, updatePincode } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Delivery Estimator State
  const [pinInput, setPinInput] = useState(buyerPincode || '560001');
  const [deliveryCalc, setDeliveryCalc] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState(null);

  // Review submission state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadBookData() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getBookDetails(bookId);
        if (!isMounted) return;
        setBook(data);

        // Load similar books
        api.getSimilarBooks(bookId)
          .then(res => { if (isMounted) setSimilarBooks(Array.isArray(res) ? res : []); })
          .catch(() => {});

        // Load reviews
        api.getBookReviews(bookId)
          .then(res => { if (isMounted) setReviews(Array.isArray(res) ? res : []); })
          .catch(() => {});

        // Run initial delivery estimate
        runDeliveryEstimate(data.pickup_pincode || '560001', pinInput, data.weight_grams, data.selling_price);

      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load book details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBookData();
    return () => { isMounted = false; };
  }, [bookId]);

  const runDeliveryEstimate = async (sellerPin, buyerPin, weight, price) => {
    if (!buyerPin || buyerPin.length !== 6) return;
    setEstimating(true);
    setEstimateError(null);
    try {
      const res = await api.estimateDelivery({
        seller_pincode: sellerPin,
        buyer_pincode: buyerPin,
        weight_grams: weight || 450,
        book_price: price || 0
      });
      setDeliveryCalc(res);
      updatePincode(buyerPin);
    } catch (err) {
      setEstimateError(err.message || 'Could not estimate delivery distance.');
    } finally {
      setEstimating(false);
    }
  };

  const handlePincodeSubmit = (e) => {
    e.preventDefault();
    if (book) {
      runDeliveryEstimate(book.pickup_pincode || '560001', pinInput, book.weight_grams, book.selling_price);
    }
  };

  const handleAddToCart = () => {
    if (!book) return;
    const res = addToCart(book);
    alert(res.message);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      await api.createReview({
        book_id: book.id,
        seller_id: book.owner_id,
        rating: reviewRating,
        comment: reviewComment.trim(),
        condition_rating: 'Accurate as described'
      });
      alert('Review submitted successfully!');
      setShowReviewModal(false);
      setReviewComment('');
      // Reload reviews
      const updated = await api.getBookReviews(book.id);
      setReviews(updated);
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-600 font-medium">Inspecting pre-owned book details...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-rose-900 mb-2">Book Not Found</h2>
          <p className="text-rose-700 text-sm mb-6">{error || 'This listing might have been removed or sold.'}</p>
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-md transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const wishlisted = isBookWishlisted(book.id);
  const savings = Math.max(0, (book.original_price || 0) - (book.selling_price || 0));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-700 font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert('Listing link copied to clipboard!');
              }
            }}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors"
            title="Share Listing"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => toggleWishlist(book.id).catch(err => alert(err.message))}
            className={`p-2 rounded-xl border transition-colors ${
              wishlisted 
                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                : 'border-stone-200 hover:bg-stone-100 text-stone-600'
            }`}
            title={wishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Image & Media Gallery (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative rounded-3xl overflow-hidden border border-stone-200 bg-stone-100 shadow-md aspect-3/4 max-h-[520px]">
            <img
              src={book.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'}
              alt={book.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';
              }}
            />

            {/* Condition Ribbon */}
            <div className="absolute top-4 left-4">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-stone-900/80 backdrop-blur-md text-white shadow-lg tracking-wide uppercase">
                Condition: {book.condition}
              </span>
            </div>

            {/* Sold Out Overlay */}
            {book.is_sold && (
              <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center">
                <div className="bg-rose-600 text-white px-6 py-2.5 rounded-2xl font-black uppercase tracking-widest text-lg shadow-2xl border-2 border-white/20">
                  This Copy Has Been Sold
                </div>
              </div>
            )}
          </div>

          {/* Second-Hand Quality & Safety Checklist */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4">
            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              BookLoop Verified Pre-Owned Guarantee
            </h4>
            <ul className="text-xs text-emerald-800 space-y-1.5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Physical inspection by student seller</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Price strictly below original retail MRP</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Secure transit with live PIN-code tracking</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Book Details, Pricing, Delivery & Actions (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Category & Edition */}
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              <span>{book.category_name}</span>
              <span>•</span>
              <span className="text-stone-500 font-medium">{book.edition || 'Standard Edition'}</span>
            </div>

            {/* Book Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-snug">
              {book.title}
            </h1>

            {/* Author */}
            <p className="text-base text-stone-600 mt-1">
              by <span className="font-semibold text-stone-900">{book.author}</span>
            </p>

            {/* Rating Stars & Views */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-amber-800 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>4.8 / 5.0</span>
              </div>
              <span className="text-xs text-stone-400">({reviews.length} reviews)</span>
              <span className="text-xs text-stone-300">|</span>
              <span className="text-xs text-stone-500">{book.views_count || 1} student views</span>
            </div>

            {/* Pricing Section (Amazon / Flipkart Style) */}
            <div className="mt-5 p-5 bg-stone-50/80 rounded-2xl border border-stone-200">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
                  ₹{Math.round(book.selling_price)}
                </span>
                {book.original_price > book.selling_price && (
                  <span className="text-lg text-stone-400 line-through">
                    MRP ₹{Math.round(book.original_price)}
                  </span>
                )}
                {book.discount_percent > 0 && (
                  <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-black shadow-xs">
                    {Math.round(book.discount_percent)}% OFF
                  </span>
                )}
              </div>

              {savings > 0 && (
                <div className="mt-2 text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>You save ₹{Math.round(savings)} on this pre-owned book!</span>
                </div>
              )}

              <p className="text-[11px] text-stone-500 mt-2">
                Inclusive of all taxes. Second-hand single copy. When purchased, this listing is locked immediately.
              </p>
            </div>

            {/* Delivery Price & Distance Estimator */}
            <div className="mt-6 p-5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-teal-600" />
                  <span>Delivery & Distance Estimator</span>
                </h3>
                <span className="text-xs text-stone-500">
                  Seller in: <strong className="text-stone-800">{book.pickup_city || 'Bengaluru'} ({book.pickup_pincode || '560001'})</strong>
                </span>
              </div>

              {/* PIN Code Input Form */}
              <form onSubmit={handlePincodeSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter your 6-digit delivery PIN"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={estimating}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  {estimating ? 'Calculating...' : 'Check PIN'}
                </button>
              </form>

              {/* Delivery Results */}
              {deliveryCalc && (
                <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100">
                    <span className="text-[10px] text-teal-700 font-semibold block uppercase">Road Distance</span>
                    <strong className="text-sm font-black text-teal-950">{deliveryCalc.distance_km} km</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 font-semibold block uppercase">Delivery Fee</span>
                    <strong className="text-sm font-black text-emerald-950">
                      {deliveryCalc.is_free_delivery ? 'FREE' : `₹${Math.round(deliveryCalc.delivery_charge)}`}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200">
                    <span className="text-[10px] text-stone-500 font-semibold block uppercase">Est. Arrival</span>
                    <strong className="text-xs font-bold text-stone-900">{deliveryCalc.estimated_days}</strong>
                  </div>
                </div>
              )}

              {estimateError && (
                <p className="mt-2 text-xs text-rose-600">{estimateError}</p>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              {!book.is_sold ? (
                <>
                  <button
                    onClick={handleAddToCart}
                    className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl border-2 border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <ShoppingCart className="w-4 h-4 text-emerald-700" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    onClick={() => onBuyNow ? onBuyNow(book) : handleAddToCart()}
                    className="w-full sm:flex-1.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <span>Buy Now (₹{Math.round(book.selling_price)})</span>
                  </button>
                </>
              ) : (
                <div className="w-full py-3.5 px-6 rounded-2xl bg-stone-100 text-stone-400 font-bold text-sm text-center border border-stone-200">
                  Item Sold to Another Reader
                </div>
              )}

              {onAskAI && (
                <button
                  onClick={() => onAskAI(`Tell me about the book "${book.title}" by ${book.author}. Is it worth buying for ₹${book.selling_price}?`)}
                  className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-all flex items-center justify-center gap-1.5"
                  title="Ask Gemini AI for summary and opinion"
                >
                  <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
                  <span>Ask AI</span>
                </button>
              )}
            </div>

            {/* Book Metadata Specs Table */}
            <div className="mt-8">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-3">
                Book Specifications
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">ISBN</span>
                  <span className="font-bold text-stone-800 truncate block">{book.isbn || 'N/A'}</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">Published</span>
                  <span className="font-bold text-stone-800">{book.publication_year || '2021'}</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">Pages</span>
                  <span className="font-bold text-stone-800">{book.pages || 320}</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">Est. Weight</span>
                  <span className="font-bold text-stone-800">{book.weight_grams || 450}g</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {book.description && (
              <div className="mt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-2">
                  Seller's Notes & Description
                </h3>
                <p className="text-sm text-stone-700 leading-relaxed bg-stone-50/50 p-4 rounded-2xl border border-stone-100">
                  {book.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verified Reviews & Student Ratings Section */}
      <div className="mt-16 pt-10 border-t border-stone-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Student Reviews & Condition Feedback</h2>
            <p className="text-xs text-stone-500 mt-0.5">Real verified ratings from fellow readers</p>
          </div>
          
          {isAuthenticated && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              Write a Review
            </button>
          )}
        </div>

        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                      {rev.buyer_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-xs font-bold text-stone-800">{rev.buyer_name}</span>
                    {rev.is_verified_purchase && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified Buyer
                      </span>
                    )}
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-500' : 'text-stone-300'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-stone-700 italic">"{rev.comment}"</p>
                <div className="mt-2 text-[10px] text-stone-400 font-medium">
                  Condition Accuracy: <span className="text-stone-700">{rev.condition_rating}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-500 italic">No reviews yet for this listing. Be the first reader to review it!</p>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-3">Review Pre-Owned Book</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Star Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-stone-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Your Feedback</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was the physical condition of this book? Did it match the seller's description?"
                  className="w-full p-3 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Similar Books Shelf */}
      {similarBooks.length > 0 && (
        <div className="mt-16 pt-10 border-t border-stone-200">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-stone-900">Similar Pre-Owned Books</h2>
            <p className="text-xs text-stone-500 mt-0.5">Explore related titles in {book.category_name}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {similarBooks.map((simBook) => (
              <BookCard
                key={simBook.id}
                book={simBook}
                onSelect={(b) => onSelectBook(b.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
