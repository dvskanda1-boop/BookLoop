import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  BookOpen, Sparkles, ShoppingCart, Heart, 
  MapPin, ShieldCheck, User, LogOut, Menu, X, PlusCircle, 
  Package, Search, Home, Layers, Coins
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
    setMobileMenuOpen(false);
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
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
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
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-100 text-left border border-transparent hover:border-stone-200 transition-all shrink-0 cursor-pointer"
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
              className="absolute right-1 top-1 bottom-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Go
            </button>
          </form>

          {/* Actions & Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Sell Your Book CTA */}
            <button
              onClick={() => handleNavClick('sell-book')}
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden xs:inline">Sell a Book</span>
              <span className="xs:hidden">Sell</span>
            </button>

            {/* AI Assistant Pill */}
            <button
              onClick={() => handleNavClick('ai-assistant')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'ai-assistant'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-teal-50 text-teal-800 hover:bg-teal-100/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              <span>AI Assistant</span>
            </button>

            {/* Wishlist Icon */}
            <button
              onClick={() => handleNavClick('wishlist')}
              className="relative p-2 rounded-xl hover:bg-stone-100 text-stone-600 hover:text-rose-600 transition-colors cursor-pointer"
              title="Saved Wishlist"
              aria-label="Wishlist"
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
              className="relative p-2 rounded-xl hover:bg-stone-100 text-stone-600 hover:text-emerald-700 transition-colors cursor-pointer"
              title="View Cart"
              aria-label="Cart"
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
              <div className="flex items-center gap-1 pl-1 border-l border-stone-200">
                <button
                  onClick={() => handleNavClick('orders')}
                  className={`hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    activePage === 'orders' ? 'bg-stone-200 text-stone-900' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                  title="My Orders & Sales"
                >
                  <Package className="w-4 h-4 text-stone-500" />
                  <span>Orders</span>
                </button>

                <button
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  title="Your Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Sub-Navbar Row for quick category / feature jumps (Desktop) */}
        <div className="hidden md:flex items-center justify-between py-2 border-t border-stone-100 text-xs text-stone-600 font-semibold">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => handleNavClick('marketplace')}
              className={`hover:text-emerald-700 transition-colors cursor-pointer ${activePage === 'marketplace' ? 'text-emerald-700 font-bold' : ''}`}
            >
              All Pre-Owned Books
            </button>
            <button
              onClick={() => handleNavClick('orders')}
              className={`hover:text-emerald-700 transition-colors cursor-pointer ${activePage === 'orders' ? 'text-emerald-700 font-bold' : ''}`}
            >
              My Orders & Sales
            </button>
            <button
              onClick={() => handleNavClick('bookshelf')}
              className={`hover:text-emerald-700 transition-colors cursor-pointer ${activePage === 'bookshelf' ? 'text-emerald-700 font-bold' : ''}`}
            >
              My Bookshelf
            </button>
            <button
              onClick={() => handleNavClick('exchanges')}
              className={`hover:text-emerald-700 transition-colors cursor-pointer ${activePage === 'exchanges' ? 'text-emerald-700 font-bold' : ''}`}
            >
              Book Exchanges
            </button>
            <button
              onClick={() => handleNavClick('wallet')}
              className={`hover:text-emerald-700 transition-colors cursor-pointer ${activePage === 'wallet' ? 'text-emerald-700 font-bold' : ''}`}
            >
              Credits Wallet
            </button>
            {isAdmin && (
              <button
                onClick={() => handleNavClick('admin')}
                className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
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
        <div className="md:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-xl">
          
          {/* Mobile Search Form */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, ISBN..."
              className="w-full pl-9 pr-12 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 text-white rounded-lg text-xs font-bold"
            >
              Go
            </button>
          </form>

          {/* Delivery PIN Code pill on Mobile */}
          <button
            onClick={() => {
              setShowPincodeModal(true);
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-left text-xs"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Deliver to: <strong>{pincodeCity} ({buyerPincode})</strong></span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold">Change PIN</span>
          </button>

          {/* Primary Mobile Navigation Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => handleNavClick('landing')}
              className={`p-3 rounded-xl text-left flex items-center gap-2 ${
                activePage === 'landing' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-stone-50 text-stone-800'
              }`}
            >
              <Home className="w-4 h-4 text-emerald-600" />
              <span>Home</span>
            </button>

            <button
              onClick={() => handleNavClick('marketplace')}
              className={`p-3 rounded-xl text-left flex items-center gap-2 ${
                activePage === 'marketplace' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-stone-50 text-stone-800'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Marketplace</span>
            </button>

            <button
              onClick={() => handleNavClick('sell-book')}
              className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-left font-bold flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Sell a Book</span>
            </button>

            <button
              onClick={() => handleNavClick('ai-assistant')}
              className="p-3 bg-teal-50 text-teal-800 rounded-xl text-left font-bold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>AI Assistant</span>
            </button>

            <button
              onClick={() => handleNavClick('cart')}
              className="p-3 bg-stone-50 text-stone-800 rounded-xl text-left flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4 text-stone-600" />
              <span>Cart ({cartCount})</span>
            </button>

            <button
              onClick={() => handleNavClick('wishlist')}
              className="p-3 bg-stone-50 text-stone-800 rounded-xl text-left flex items-center gap-2"
            >
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Wishlist ({wishlistCount})</span>
            </button>

            <button
              onClick={() => handleNavClick('orders')}
              className="p-3 bg-stone-50 text-stone-800 rounded-xl text-left flex items-center gap-2"
            >
              <Package className="w-4 h-4 text-stone-600" />
              <span>My Orders</span>
            </button>

            <button
              onClick={() => handleNavClick('profile')}
              className="p-3 bg-stone-50 text-stone-800 rounded-xl text-left flex items-center gap-2"
            >
              <User className="w-4 h-4 text-stone-600" />
              <span>My Profile</span>
            </button>

            <button
              onClick={() => handleNavClick('bookshelf')}
              className="p-3 bg-stone-50 text-stone-800 rounded-xl text-left flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-stone-600" />
              <span>My Bookshelf</span>
            </button>

            <button
              onClick={() => handleNavClick('wallet')}
              className="p-3 bg-stone-50 text-stone-800 rounded-xl text-left flex items-center gap-2"
            >
              <Coins className="w-4 h-4 text-amber-600" />
              <span>Credits Wallet</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNavClick('admin')}
                className="col-span-2 p-3 bg-amber-50 text-amber-900 rounded-xl text-left font-bold flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Admin Command Hub</span>
              </button>
            )}
          </div>

          {/* User Sign In / Out for Mobile */}
          {isAuthenticated ? (
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out ({user?.name || 'Student'})</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleNavClick('login')}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl text-center shadow-xs cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavClick('register')}
                className="py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl text-center cursor-pointer"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}

      {/* Change PIN Code Modal */}
      {showPincodeModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-stone-900 mb-1 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>Choose Delivery Location</span>
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Enter your 6-digit Indian postal PIN code to see road distance and accurate courier charges.
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
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPincodeModal(false)}
                  className="px-4 py-2 border border-stone-200 text-xs font-bold rounded-xl text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
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
