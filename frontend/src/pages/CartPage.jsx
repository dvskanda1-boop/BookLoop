import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Trash2, ArrowRight, ShieldCheck, MapPin, 
  Truck, CheckCircle2, AlertCircle, ArrowLeft, Plus, CreditCard, Banknote
} from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const CartPage = ({ onExploreMarketplace, onOrderCompleted }) => {
  const { cartItems, removeFromCart, clearCart, buyerPincode, updatePincode } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Delivery Addresses
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddress, setShowNewAddress] = useState(false);

  // New Address Form
  const [newRecipient, setNewRecipient] = useState(user?.name || '');
  const [newPhone, setNewPhone] = useState(user?.phone || '9876543210');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState(user?.city || 'Bengaluru');
  const [newPin, setNewPin] = useState(buyerPincode || '560001');

  // Checkout State
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [deliveryEstimates, setDeliveryEstimates] = useState({});
  const [loadingEstimates, setLoadingEstimates] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      api.getAddresses()
        .then(res => {
          const safeRes = Array.isArray(res) ? res : (res?.addresses || []);
          setAddresses(safeRes);
          const def = safeRes.find(a => a.is_default) || safeRes[0];
          if (def) {
            setSelectedAddressId(def.id);
            setNewPin(def.pincode);
            updatePincode(def.pincode);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Recalculate delivery for items whenever destination PIN changes
  useEffect(() => {
    if (cartItems.length === 0) return;
    let isMounted = true;
    setLoadingEstimates(true);

    async function fetchEstimates() {
      const estimates = {};
      for (const item of cartItems) {
        try {
          const est = await api.estimateDelivery({
            seller_pincode: item.pickup_pincode || '560001',
            buyer_pincode: newPin || '560001',
            weight_grams: item.weight_grams || 450,
            book_price: item.selling_price || 0
          });
          estimates[item.id] = est;
        } catch {
          estimates[item.id] = {
            distance_km: 15,
            delivery_charge: 35,
            estimated_days: '2-4 business days',
            is_free_delivery: false
          };
        }
      }
      if (isMounted) {
        setDeliveryEstimates(estimates);
        setLoadingEstimates(false);
      }
    }

    fetchEstimates();
    return () => { isMounted = false; };
  }, [cartItems, newPin]);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!newStreet.trim() || newPin.length !== 6) {
      alert('Please fill out street address and valid 6-digit PIN code.');
      return;
    }
    try {
      const addr = await api.createAddress({
        label: 'Delivery Address',
        recipient_name: newRecipient.trim(),
        phone: newPhone.trim(),
        street_address: newStreet.trim(),
        city: newCity.trim(),
        pincode: newPin.trim(),
        state: 'Karnataka',
        is_default: true
      });
      setAddresses(prev => [addr, ...prev]);
      setSelectedAddressId(addr.id);
      setShowNewAddress(false);
      updatePincode(addr.pincode);
    } catch (err) {
      alert(err.message || 'Could not save address');
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      alert('Please log in to place your book order.');
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    const currentAddr = addresses.find(a => a.id === selectedAddressId);
    const shippingAddress = currentAddr ? currentAddr.street_address : newStreet;
    const recipientName = currentAddr ? currentAddr.recipient_name : newRecipient;
    const recipientPhone = currentAddr ? currentAddr.phone : newPhone;
    const city = currentAddr ? currentAddr.city : newCity;
    const pin = currentAddr ? currentAddr.pincode : newPin;

    if (!shippingAddress.trim() || pin.length !== 6) {
      setOrderError('Please provide a complete delivery address and 6-digit PIN code.');
      return;
    }

    setPlacingOrder(true);
    setOrderError(null);

    const placedOrders = [];

    try {
      // Place order for each individual pre-owned book (atomic single-copy lock)
      for (const item of cartItems) {
        const order = await api.createOrder({
          book_id: item.id,
          delivery_address_id: selectedAddressId || undefined,
          recipient_name: recipientName.trim(),
          recipient_phone: recipientPhone.trim(),
          shipping_address: shippingAddress.trim(),
          buyer_city: city.trim(),
          buyer_state: 'Karnataka',
          buyer_pincode: pin.trim(),
          payment_method: paymentMethod
        });
        placedOrders.push(order);
      }

      clearCart();
      alert(`Success! ${placedOrders.length} pre-owned book order(s) placed successfully.`);
      if (onOrderCompleted) {
        onOrderCompleted(placedOrders);
      }
    } catch (err) {
      setOrderError(err.message || 'Order placement failed.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Calculations
  const mrpTotal = cartItems.reduce((acc, item) => acc + (item.original_price || item.selling_price || 0), 0);
  const subtotal = cartItems.reduce((acc, item) => acc + (item.selling_price || 0), 0);
  const totalSavings = Math.max(0, mrpTotal - subtotal);
  const totalDeliveryFee = cartItems.reduce((acc, item) => {
    const est = deliveryEstimates[item.id];
    return acc + (est ? est.delivery_charge : 35);
  }, 0);
  const netPayable = subtotal + totalDeliveryFee;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-stone-400">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-stone-900 tracking-tight mb-2">Your Shopping Cart is Empty</h2>
        <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">
          Discover high-quality pre-owned books at student-friendly prices. Every book deserves another chapter!
        </p>
        <button
          onClick={onExploreMarketplace}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all inline-flex items-center gap-2"
        >
          <span>Explore Second-Hand Books</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Page Title */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-7 h-7 text-emerald-600" />
            <span>Second-Hand Shopping Cart ({cartItems.length})</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Pre-owned single copies reserved in your cart. Proceed to checkout to lock your copies.
          </p>
        </div>

        <button
          onClick={onExploreMarketplace}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>
      </div>

      {orderError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{orderError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Cart Items & Delivery Address (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Cart Items List */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs divide-y divide-stone-100">
            {cartItems.map((item) => {
              const est = deliveryEstimates[item.id];
              return (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  
                  <div className="flex gap-4 items-center">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200'}
                      alt={item.title}
                      className="w-16 h-20 object-cover rounded-xl border border-stone-200 shrink-0 bg-stone-100"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                        Condition: {item.condition}
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-stone-500">by {item.author}</p>
                      
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-stone-500">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>Seller: {item.pickup_city || 'Bengaluru'} ({item.pickup_pincode || '560001'})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:justify-end">
                    <div className="text-right">
                      <div className="flex items-baseline gap-2 justify-end">
                        <span className="text-base font-black text-stone-900">₹{Math.round(item.selling_price)}</span>
                        {item.original_price > item.selling_price && (
                          <span className="text-xs text-stone-400 line-through">₹{Math.round(item.original_price)}</span>
                        )}
                      </div>
                      {est && (
                        <span className="text-[11px] font-medium text-teal-700 block">
                          Delivery: {est.is_free_delivery ? 'FREE' : `+₹${Math.round(est.delivery_charge)}`} ({est.distance_km} km)
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 transition-colors"
                      title="Remove from Cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Delivery Address Block */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Shipping & Campus Delivery Address</span>
              </h3>

              <button
                type="button"
                onClick={() => setShowNewAddress(!showNewAddress)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showNewAddress ? 'Select Existing' : 'Add New Address'}</span>
              </button>
            </div>

            {/* Saved Addresses List */}
            {!showNewAddress && addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddressId(addr.id);
                      setNewPin(addr.pincode);
                      updatePincode(addr.pincode);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-stone-900">{addr.recipient_name}</span>
                      {addr.is_default && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Default</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 line-clamp-1">{addr.street_address}</p>
                    <p className="text-xs text-stone-500 mt-0.5 font-semibold">{addr.city}, PIN {addr.pincode}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {/* New Address Input */}
            {(showNewAddress || addresses.length === 0) && (
              <form onSubmit={handleCreateAddress} className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Recipient Name *</label>
                    <input
                      type="text"
                      required
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      placeholder="Student full name"
                      className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Mobile Phone *</label>
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="10-digit number"
                      className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Street / Hostel / Room / Campus Address *</label>
                  <input
                    type="text"
                    required
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="Hostel Block B, Room 204, Campus Rd"
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder="Bengaluru"
                      className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">6-Digit PIN Code *</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={newPin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setNewPin(val);
                        if (val.length === 6) updatePincode(val);
                      }}
                      placeholder="560001"
                      className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-stone-800"
                >
                  Save Address
                </button>
              </form>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Select Payment Method</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === 'CASH_ON_DELIVERY'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-stone-900">Cash on Delivery (COD)</span>
                  <span className="text-[11px] text-stone-500">Pay cash upon book handover</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('INSTANT_ONLINE')}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === 'INSTANT_ONLINE'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-teal-700 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-stone-900">Campus UPI / Online Pay</span>
                  <span className="text-[11px] text-stone-500">Instant test payment simulator</span>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Price Summary & Place Order CTA (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-stone-600 pt-2 border-t border-stone-100">
              <div className="flex justify-between">
                <span>Original Retail MRP:</span>
                <span className="line-through text-stone-400">₹{Math.round(mrpTotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>Second-Hand Books Price:</span>
                <span className="font-bold text-stone-900">₹{Math.round(subtotal)}</span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Total Buyer Savings:</span>
                  <span>-₹{Math.round(totalSavings)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Courier Delivery:</span>
                <span className="font-bold text-stone-900">₹{Math.round(totalDeliveryFee)}</span>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                <span className="text-sm font-black text-stone-900">Total Payable:</span>
                <span className="text-2xl font-black text-emerald-700">₹{Math.round(netPayable)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={placingOrder}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>{placingOrder ? 'Locking Single Copies...' : `Place Order (₹${Math.round(netPayable)})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Safe student checkout & verified condition guarantee</span>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
