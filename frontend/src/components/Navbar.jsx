import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  BookOpen, Sparkles, Layers, ShoppingCart, Heart, 
  MapPin, ShieldCheck, User, LogOut, Menu, X, PlusCircle, 
  Package, Search, ChevronDown, Coins
} from 'lucide-react';

export const Navbar = ({ activePage, setActivePage, onSearchSubmit }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount, wishlistCount, buyerPincode, pincodeCity, updatePincode } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [tempPin, setTempPin] = useState(buyerPincode || '560001');
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setMobileMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
    setActivePage('marketplace');
  };

  const handlePincodeSave = (e) => {
    e.preventDefault();
    if (tempPin.length === 6) {
      updatePincode(tempPin);
      setShowPincodeModal(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Brand Logo & Tagline */}
          <div 
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0 select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                BookLoop <span className="text-emerald-600">AI</span>
              </span>
              <span className="hidden sm:block text-[10px] text-stone-500 font-semibold tracking-wider uppercase -mt-1">
                Pre-Owned Marketplace
              </span>
            </div>
          </div>

          {/* Delivery Location Pill (Amazon Style) */}
          <button
            onClick={() => setShowPincodeModal(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-100 text-left border border-transparent hover:border-stone-200 transition-all shrink-0"
            title="Change Delivery PIN Code"
          >
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-[11px] leading-tight">
              <span className="text-stone-400 block font-medium">Deliver to</span>
              <span className="font-bold text-stone-800">{pincodeCity} {buyerPincode}</span>
            </div>
          </button>

          {/* Search Bar (Amazon / Flipkart Style) */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:flex items-center relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pre-owned books by title, author, or ISBN..."
              className="w-full pl-10 pr-12 py-2 bg-stone-100/80 hover:bg-stone-100 focus:bg-white border border-stone-200 rounded-full text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5" />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all shadow-xs"
            >
              Go
            </button>
          </form>

          {/* Actions & Navigation Links */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Sell Your Book CTA */}
            <button
              onClick={() => handleNavClick('sell-book')}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-sm hover:shadow-md transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Sell a Book</span>
            </button>

            {/* AI Assistant Pill */}
            <button
              onClick={() => handleNavClick('ai-assistant')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activePage === 'ai-assistant'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-teal-50 text-teal-800 hover:bg-teal-100/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              <span>AI Assistant</span>
            </button>

            {/* Wishlist Icon */}
            <button
              onClick={() => handleNavClick('wishlist')}
              className="relative p-2 rounded-xl hover:bg-stone-100 text-stone-600 hover:text-rose-600 transition-colors"
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => handleNavClick('cart')}
              className="relative p-2 rounded-xl hover:bg-stone-100 text-stone-600 hover:text-emerald-700 transition-colors"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-stone-200">
                <button
                  onClick={() => handleNavClick('orders')}
                  className={`hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                    activePage === 'orders' ? 'bg-stone-200 text-stone-900' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                  title="My Orders & Sales"
                >
                  <Package className="w-4 h-4 text-stone-500" />
                  <span>Orders</span>
                </button>

                <button
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors"
                  title="Your Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Sub-Navbar Row for quick category / feature jumps */}
        <div className="hidden md:flex items-center justify-between py-2 border-t border-stone-100 text-xs text-stone-600 font-semibold">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => handleNavClick('marketplace')}
              className={`hover:text-emerald-700 transition-colors ${activePage === 'marketplace' ? 'text-emerald-700 font-bold' : ''}`}
            >
              All Pre-Owned Books
            </button>
            <button
              onClick={() => handleNavClick('orders')}
              className={`hover:text-emerald-700 transition-colors ${activePage === 'orders' ? 'text-emerald-700 font-bold' : ''}`}
            >
              My Orders & Sales
            </button>
            <button
              onClick={() => handleNavClick('bookshelf')}
              className={`hover:text-emerald-700 transition-colors ${activePage === 'bookshelf' ? 'text-emerald-700 font-bold' : ''}`}
            >
              My Bookshelf
            </button>
            <button
              onClick={() => handleNavClick('exchanges')}
              className={`hover:text-emerald-700 transition-colors ${activePage === 'exchanges' ? 'text-emerald-700 font-bold' : ''}`}
            >
              Book Exchanges
            </button>
            <button
              onClick={() => handleNavClick('wallet')}
              className={`hover:text-emerald-700 transition-colors ${activePage === 'wallet' ? 'text-emerald-700 font-bold' : ''}`}
            >
              Credits Wallet
            </button>
            {isAdmin && (
              <button
                onClick={() => handleNavClick('admin')}
                className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Hub</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-stone-400 italic">
            "Every book deserves another chapter."
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books..."
              className="w-full pl-9 pr-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </form>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button onClick={() => handleNavClick('marketplace')} className="p-2 bg-stone-50 rounded-xl text-left">Marketplace</button>
            <button onClick={() => handleNavClick('sell-book')} className="p-2 bg-emerald-50 text-emerald-800 rounded-xl text-left font-bold">Sell a Book</button>
            <button onClick={() => handleNavClick('ai-assistant')} className="p-2 bg-teal-50 text-teal-800 rounded-xl text-left font-bold">AI Assistant</button>
            <button onClick={() => handleNavClick('cart')} className="p-2 bg-stone-50 rounded-xl text-left">Cart ({cartCount})</button>
            <button onClick={() => handleNavClick('wishlist')} className="p-2 bg-stone-50 rounded-xl text-left">Wishlist ({wishlistCount})</button>
            <button onClick={() => handleNavClick('orders')} className="p-2 bg-stone-50 rounded-xl text-left">My Orders</button>
            <button onClick={() => handleNavClick('bookshelf')} className="p-2 bg-stone-50 rounded-xl text-left">My Bookshelf</button>
            <button onClick={() => handleNavClick('wallet')} className="p-2 bg-stone-50 rounded-xl text-left">Credits Wallet</button>
            {isAdmin && (
              <button onClick={() => handleNavClick('admin')} className="p-2 bg-amber-50 text-amber-800 rounded-xl text-left font-bold">Admin Hub</button>
            )}
          </div>

          {isAuthenticated ? (
            <button
              onClick={logout}
              className="w-full py-2 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('login')}
              className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* Change PIN Code Modal */}
      {showPincodeModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-1 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>Choose Delivery Location</span>
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Enter your Indian postal PIN code to see accurate delivery charges and distance estimates.
            </p>
            <form onSubmit={handlePincodeSave}>
              <input
                type="text"
                maxLength={6}
                value={tempPin}
                onChange={(e) => setTempPin(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit PIN code (e.g., 560001)"
                className="w-full p-3 border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 mb-4 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPincodeModal(false)}
                  className="px-4 py-2 border border-stone-200 text-xs font-bold rounded-xl text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Update PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
