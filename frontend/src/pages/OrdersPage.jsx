import React, { useState, useEffect } from 'react';
import { 
  Package, Truck, CheckCircle2, Clock, AlertCircle, 
  MapPin, Star, ArrowRight, ShieldCheck, ChevronRight 
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const OrdersPage = ({ onSelectBook }) => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' or 'sales'

  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review modal state
  const [reviewOrder, setReviewOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [conditionRating, setConditionRating] = useState('Accurate as described');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadOrders();
  }, [isAuthenticated, activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'purchases') {
        const data = await api.getMyOrders();
        setPurchases(Array.isArray(data) ? data : []);
      } else {
        const data = await api.getMySales();
        setSales(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      alert(`Order updated to: ${newStatus}`);
      loadOrders();
    } catch (err) {
      alert(err.message || 'Could not update order status');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewOrder || !comment.trim()) return;
    setSubmittingReview(true);
    try {
      await api.createReview({
        book_id: reviewOrder.book_id,
        seller_id: reviewOrder.seller_id,
        order_id: reviewOrder.id,
        rating: rating,
        comment: comment.trim(),
        condition_rating: conditionRating
      });
      alert('Review posted successfully! Thank you for keeping the BookLoop community trustworthy.');
      setReviewOrder(null);
      setComment('');
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const statusBadges = {
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
    SHIPPED: 'bg-teal-100 text-teal-800 border-teal-200',
    OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-800 border-amber-200',
    DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200'
  };

  const timelineSteps = ['CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2.5">
          <Package className="w-7 h-7 text-emerald-600" />
          <span>Orders & Marketplace Logistics</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Track pre-owned book deliveries, dispatch sold copies, and rate condition accuracy.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 mb-6">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`py-3 px-5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'purchases'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>My Purchases</span>
          {purchases.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-200 text-stone-800">
              {purchases.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`py-3 px-5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'sales'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>My Sales to Dispatch</span>
          {sales.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200 text-emerald-900 font-bold">
              {sales.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-stone-500">Loading order timeline...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-xs text-rose-700">
          {error}
        </div>
      ) : activeTab === 'purchases' ? (
        // Purchases List
        purchases.length === 0 ? (
          <div className="py-16 text-center bg-stone-50 rounded-3xl border border-stone-200 p-8">
            <Package className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900">No purchases yet</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              You haven't bought any pre-owned books yet. Check out the marketplace for top deals!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {purchases.map((order) => {
              const currentStepIdx = timelineSteps.indexOf(order.status);
              return (
                <div key={order.id} className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs">
                  
                  {/* Top Order Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100 text-xs">
                    <div>
                      <span className="text-stone-400 block font-medium">Order Number</span>
                      <strong className="text-stone-900 font-mono">{order.order_number}</strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block font-medium">Tracking Code</span>
                      <strong className="text-teal-700 font-mono">{order.tracking_number}</strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block font-medium">Order Date</span>
                      <span className="text-stone-800 font-semibold">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-stone-400 block font-medium">Total Paid</span>
                      <strong className="text-emerald-700 text-sm font-black">₹{Math.round(order.total_amount)}</strong>
                    </div>
                  </div>

                  {/* Book Card & Shipping Info */}
                  <div className="py-4 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex gap-4 items-center">
                      <img
                        src={order.book_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200'}
                        alt={order.book_title}
                        className="w-16 h-20 object-cover rounded-xl border border-stone-200 bg-stone-100 shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm hover:text-emerald-700 cursor-pointer" onClick={() => onSelectBook && onSelectBook(order.book_id)}>
                          {order.book_title}
                        </h4>
                        <p className="text-xs text-stone-500">by {order.book_author}</p>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-stone-500">
                          <span>Seller: <strong className="text-stone-800">{order.seller_name}</strong></span>
                          <span>•</span>
                          <span>Delivery Distance: <strong className="text-teal-700">{order.delivery_distance_km} km</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address & Status Pill */}
                    <div className="text-xs space-y-1 md:text-right">
                      <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs mb-1" style={{}}>
                        <span className={`px-2.5 py-0.5 rounded-full ${statusBadges[order.status] || 'bg-stone-100'}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-stone-600 line-clamp-1">{order.shipping_address}</p>
                      <p className="text-stone-500 font-semibold">{order.buyer_city}, PIN {order.buyer_pincode}</p>
                    </div>
                  </div>

                  {/* Delivery Timeline Tracker */}
                  <div className="pt-4 border-t border-stone-100">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {timelineSteps.map((step, idx) => {
                        const isDone = currentStepIdx >= idx;
                        const isCurrent = currentStepIdx === idx;
                        return (
                          <div key={step} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                              isDone ? 'bg-emerald-600 text-white shadow-sm' : 'bg-stone-100 text-stone-400'
                            }`}>
                              {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                              isCurrent ? 'text-emerald-700' : isDone ? 'text-stone-800' : 'text-stone-400'
                            }`}>
                              {step.replace(/_/g, ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Bar (Leave Review) */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-medium">
                      Est. Arrival: <strong className="text-stone-800">{order.estimated_delivery_date}</strong>
                    </span>

                    <button
                      onClick={() => setReviewOrder(order)}
                      className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>Rate & Review Seller</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )
      ) : (
        // Sales List (Seller Management)
        sales.length === 0 ? (
          <div className="py-16 text-center bg-stone-50 rounded-3xl border border-stone-200 p-8">
            <Package className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900">No incoming sales yet</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              When students purchase your listed pre-owned books, orders will appear here for packaging and courier dispatch.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sales.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs">
                
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100 text-xs">
                  <div>
                    <span className="text-stone-400 block font-medium">Order Number</span>
                    <strong className="text-stone-900 font-mono">{order.order_number}</strong>
                  </div>

                  <div>
                    <span className="text-stone-400 block font-medium">Recipient Student</span>
                    <strong className="text-stone-900">{order.recipient_name} ({order.recipient_phone})</strong>
                  </div>

                  <div>
                    <span className="text-stone-400 block font-medium">Earnings</span>
                    <strong className="text-emerald-700 text-sm font-black">₹{Math.round(order.book_price)}</strong>
                  </div>

                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusBadges[order.status] || 'bg-stone-100'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="py-4 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <img
                      src={order.book_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200'}
                      alt={order.book_title}
                      className="w-16 h-20 object-cover rounded-xl border border-stone-200 bg-stone-100 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{order.book_title}</h4>
                      <p className="text-xs text-stone-500">Destination: {order.shipping_address}, {order.buyer_city} ({order.buyer_pincode})</p>
                      <p className="text-[11px] text-teal-700 font-medium mt-1">Courier Road Distance: {order.delivery_distance_km} km</p>
                    </div>
                  </div>

                  {/* Dispatch Controls */}
                  <div className="flex items-center gap-2">
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                      >
                        Mark as Shipped
                      </button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                      >
                        Mark as Delivered
                      </button>
                    )}
                    {order.status === 'DELIVERED' && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Handover Completed</span>
                      </span>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )
      )}

      {/* Review Modal */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-1">
              Rate Condition & Review Seller
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Reviewing: <strong className="text-stone-800">{reviewOrder.book_title}</strong> from <strong className="text-stone-800">{reviewOrder.seller_name}</strong>
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-500 text-amber-500' : 'text-stone-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Condition Accuracy</label>
                <select
                  value={conditionRating}
                  onChange={(e) => setConditionRating(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                >
                  <option value="Accurate as described">Accurate as described</option>
                  <option value="Better than expected">Better than expected!</option>
                  <option value="Slightly more worn">Slightly more worn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Your Review</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Did the pages, cover and binding match expectations?"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewOrder(null)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {submittingReview ? 'Posting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
