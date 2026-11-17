import React, { useState } from 'react';
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

const MainLayout = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [activePage, setActivePage] = useState('landing');
  
  // Navigation & Product State
  const [selectedBookId, setSelectedBookId] = useState(null);
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

  const handleSelectBook = (bookId) => {
    setSelectedBookId(bookId);
    setActivePage('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavbarSearch = (query) => {
    setNavbarSearchQuery(query);
    setActivePage('marketplace');
  };

  const handleAskAI = (prompt) => {
    setAiInitialPrompt(prompt);
    setActivePage('ai-assistant');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'landing':
        return (
          <LandingPage
            onExploreMarketplace={() => setActivePage('marketplace')}
            onSellBook={() => setActivePage(isAuthenticated ? 'sell-book' : 'login')}
            onOpenAI={() => setActivePage('ai-assistant')}
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
            onBack={() => setActivePage('marketplace')}
            onSelectBook={handleSelectBook}
            onBuyNow={(book) => {
              setActivePage('cart');
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
            onCancel={() => setActivePage('marketplace')}
          />
        );

      case 'cart':
        return (
          <CartPage
            onExploreMarketplace={() => setActivePage('marketplace')}
            onOrderCompleted={(orders) => {
              showToast(`Order confirmed! Tracking code generated.`);
              setActivePage('orders');
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
            onExploreMarketplace={() => setActivePage('marketplace')}
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
            setActivePage={setActivePage}
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
            setActivePage={setActivePage}
            onSuccess={(msg) => {
              showToast(msg);
              setActivePage('marketplace');
            }}
          />
        );

      case 'register':
        return (
          <RegisterPage
            setActivePage={setActivePage}
            onSuccess={(msg) => {
              showToast(msg);
              setActivePage('marketplace');
            }}
          />
        );

      default:
        return (
          <LandingPage
            onExploreMarketplace={() => setActivePage('marketplace')}
            onSellBook={() => setActivePage('sell-book')}
            onOpenAI={() => setActivePage('ai-assistant')}
            onSelectBook={handleSelectBook}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-slate-800 selection:bg-emerald-100 selection:text-emerald-900">
      
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
        setActivePage={setActivePage}
        onSearchSubmit={handleNavbarSearch}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {renderPage()}
      </main>

      {/* Footer */}
      <Footer setActivePage={setActivePage} />

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
