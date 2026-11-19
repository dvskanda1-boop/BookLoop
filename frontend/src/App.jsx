import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProductDetailPage } from './components/ProductDetailPage';

// Pages
import { LandingPage } from './pages/LandingPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { SellBookPage } from './pages/SellBookPage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { WishlistPage } from './pages/WishlistPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { BookshelfPage } from './pages/BookshelfPage';
import { ExchangesPage } from './pages/ExchangesPage';
import { WalletPage } from './pages/WalletPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

import { CheckCircle2, X } from 'lucide-react';

// Maps URL paths to active page keys
const pathToPageMap = {
  '/': 'landing',
  '/marketplace': 'marketplace',
  '/books': 'marketplace',
  '/explore': 'marketplace',
  '/sell': 'sell-book',
  '/sell-book': 'sell-book',
  '/cart': 'cart',
  '/orders': 'orders',
  '/wishlist': 'wishlist',
  '/ai': 'ai-assistant',
  '/ai-assistant': 'ai-assistant',
  '/bookshelf': 'bookshelf',
  '/exchanges': 'exchanges',
  '/wallet': 'wallet',
  '/profile': 'profile',
  '/admin': 'admin',
  '/login': 'login',
  '/register': 'register'
};

const pageToPathMap = {
  'landing': '/',
  'marketplace': '/marketplace',
  'sell-book': '/sell',
  'cart': '/cart',
  'orders': '/orders',
  'wishlist': '/wishlist',
  'ai-assistant': '/ai',
  'bookshelf': '/bookshelf',
  'exchanges': '/exchanges',
  'wallet': '/wallet',
  'profile': '/profile',
  'admin': '/admin',
  'login': '/login',
  'register': '/register'
};

const parseRouteFromUrl = () => {
  if (typeof window === 'undefined') return { page: 'landing', bookId: null };
  const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  
  // Handle /book/:id
  if (pathname.startsWith('/book/')) {
    const rawId = pathname.replace('/book/', '');
    const parsedId = parseInt(rawId, 10);
    return { page: 'product-detail', bookId: isNaN(parsedId) ? null : parsedId };
  }

  // Handle /book?id=:id
  if (pathname === '/book') {
    const params = new URLSearchParams(window.location.search);
    const qId = parseInt(params.get('id') || '', 10);
    return { page: 'product-detail', bookId: isNaN(qId) ? null : qId };
  }

  const page = pathToPageMap[pathname] || 'landing';
  return { page, bookId: null };
};

const MainLayout = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  
  // Initialize state directly from current browser URL
  const initialRoute = parseRouteFromUrl();
  const [activePage, setActivePageState] = useState(initialRoute.page);
  const [selectedBookId, setSelectedBookId] = useState(initialRoute.bookId);
  const [navbarSearchQuery, setNavbarSearchQuery] = useState('');
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  
  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Synchronize state and browser history (supports Back/Forward and direct URLs)
  const navigateTo = useCallback((pageId, bookId = null, replace = false) => {
    setActivePageState(pageId);
    if (bookId !== null && bookId !== undefined) {
      setSelectedBookId(bookId);
    }

    let targetPath = pageToPathMap[pageId] || '/';
    if (pageId === 'product-detail' && (bookId || selectedBookId)) {
      targetPath = `/book/${bookId || selectedBookId}`;
    }

    if (window.location.pathname !== targetPath) {
      const stateObj = { page: pageId, bookId: bookId || selectedBookId };
      if (replace) {
        window.history.replaceState(stateObj, '', targetPath);
      } else {
        window.history.pushState(stateObj, '', targetPath);
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedBookId]);

  // Handle browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const route = parseRouteFromUrl();
      setActivePageState(route.page);
      if (route.bookId) {
        setSelectedBookId(route.bookId);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectBook = (bookId) => {
    navigateTo('product-detail', bookId);
  };

  const handleNavbarSearch = (query) => {
    setNavbarSearchQuery(query);
    navigateTo('marketplace');
  };

  const handleAskAI = (prompt) => {
    setAiInitialPrompt(prompt);
    navigateTo('ai-assistant');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'landing':
        return (
          <LandingPage
            onExploreMarketplace={() => navigateTo('marketplace')}
            onSellBook={() => navigateTo(isAuthenticated ? 'sell-book' : 'login')}
            onOpenAI={() => navigateTo('ai-assistant')}
            onSelectBook={handleSelectBook}
          />
        );

      case 'marketplace':
        return (
          <MarketplacePage
            onSelectBook={handleSelectBook}
            initialSearchQuery={navbarSearchQuery}
          />
        );

      case 'product-detail':
        return (
          <ProductDetailPage
            bookId={selectedBookId}
            onBack={() => navigateTo('marketplace')}
            onSelectBook={handleSelectBook}
            onBuyNow={(book) => {
              navigateTo('cart');
            }}
            onAskAI={handleAskAI}
          />
        );

      case 'sell-book':
        return (
          <SellBookPage
            onBookCreated={(newBook) => {
              showToast(`Listed "${newBook.title}" successfully!`);
              handleSelectBook(newBook.id);
            }}
            onCancel={() => navigateTo('marketplace')}
          />
        );

      case 'cart':
        return (
          <CartPage
            onExploreMarketplace={() => navigateTo('marketplace')}
            onOrderCompleted={(orders) => {
              showToast(`Order confirmed! Tracking code generated.`);
              navigateTo('orders');
            }}
          />
        );

      case 'orders':
        return (
          <OrdersPage
            onSelectBook={handleSelectBook}
          />
        );

      case 'wishlist':
        return (
          <WishlistPage
            onSelectBook={handleSelectBook}
            onExploreMarketplace={() => navigateTo('marketplace')}
          />
        );

      case 'ai-assistant':
        return (
          <AIAssistantPage
            onSelectBook={handleSelectBook}
            initialPrompt={aiInitialPrompt}
          />
        );

      case 'bookshelf':
        return (
          <BookshelfPage
            setActivePage={navigateTo}
            setSelectedBook={(b) => handleSelectBook(b.id)}
            onSuccess={showToast}
          />
        );

      case 'exchanges':
        return <ExchangesPage onSuccess={showToast} />;

      case 'wallet':
        return <WalletPage />;

      case 'profile':
        return <ProfilePage onSuccess={showToast} />;

      case 'admin':
        return <AdminPage onSuccess={showToast} />;

      case 'login':
        return (
          <LoginPage
            setActivePage={navigateTo}
            onSuccess={(msg) => {
              showToast(msg);
              navigateTo('marketplace');
            }}
          />
        );

      case 'register':
        return (
          <RegisterPage
            setActivePage={navigateTo}
            onSuccess={(msg) => {
              showToast(msg);
              navigateTo('marketplace');
            }}
          />
        );

      default:
        return (
          <LandingPage
            onExploreMarketplace={() => navigateTo('marketplace')}
            onSellBook={() => navigateTo(isAuthenticated ? 'sell-book' : 'login')}
            onOpenAI={() => navigateTo('ai-assistant')}
            onSelectBook={handleSelectBook}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-slate-800 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 max-w-sm text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1 leading-snug">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:text-stone-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        activePage={activePage}
        setActivePage={navigateTo}
        onSearchSubmit={handleNavbarSearch}
      />

      {/* Main Page Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {renderPage()}
      </main>

      {/* Footer */}
      <Footer setActivePage={navigateTo} />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainLayout />
      </CartProvider>
    </AuthProvider>
  );
}
