import React, { useState, useEffect } from 'react';
import { 
  Sparkles, BookOpen, PlusCircle, ArrowRight, ShieldCheck, 
  MapPin, Tag, Truck, Heart, Coins, CheckCircle2, TrendingUp, 
  Percent, Leaf, BookCopy 
} from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { BookCard } from '../components/BookCard';

export const LandingPage = ({ onExploreMarketplace, onSellBook, onOpenAI, onSelectBook }) => {
  const { buyerPincode, pincodeCity } = useCart();

  const [shelves, setShelves] = useState({
    recommended_for_you: [],
    best_deals: [],
    under_100: [],
    under_250: [],
    books_near_you: []
  });
  const [loadingShelves, setLoadingShelves] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getCuratedShelves(buyerPincode)
      .then(data => {
        if (isMounted && data) {
          setShelves(data);
        }
      })
      .catch(err => console.warn('Could not load curated shelves:', err.message))
      .finally(() => {
        if (isMounted) setLoadingShelves(false);
      });
    return () => { isMounted = false; };
  }, [buyerPincode]);

  return (
    <div className="space-y-16 py-8 animate-fade-in">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-radial-[at_top_right] from-teal-900 via-emerald-950 to-stone-950 text-white p-8 sm:p-14 border border-emerald-800/40 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>AI-Powered Pre-Owned Book Exchange</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none">
            Read. Resell. Repeat. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              Every book deserves another chapter.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed font-medium">
            "Don't let a good book sit on a shelf. Give it a second life, and let someone else enjoy the story at a lower price."
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onExploreMarketplace}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <BookOpen className="w-4 h-4" />
              <span>Shop Pre-Owned Books</span>
            </button>

            <button
              onClick={onSellBook}
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm backdrop-blur-md transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Sell Your Book (AI Pricing)</span>
            </button>

            <button
              onClick={onOpenAI}
              className="px-5 py-3.5 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-400/30 text-teal-300 font-bold text-xs backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Ask AI Assistant</span>
            </button>
          </div>

          {/* Delivery Location Indicator */}
          <div className="pt-4 flex items-center gap-2 text-xs text-emerald-300/80 font-medium">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Delivering to <strong>{pincodeCity} ({buyerPincode})</strong> with live courier distance calculations.</span>
          </div>

        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Impact Stats Banner */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto px-4">
        <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 text-center">
          <span className="text-2xl sm:text-3xl font-black text-stone-900 block">3,400+</span>
          <span className="text-xs text-stone-500 font-medium">Books Given a Second Life</span>
        </div>
        <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 text-center">
          <span className="text-2xl sm:text-3xl font-black text-emerald-700 block">58% Avg</span>
          <span className="text-xs text-stone-500 font-medium">Discount Below Retail MRP</span>
        </div>
        <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 text-center">
          <span className="text-2xl sm:text-3xl font-black text-teal-700 block">₹4.8L+</span>
          <span className="text-xs text-stone-500 font-medium">Saved by College Students</span>
        </div>
        <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 text-center">
          <span className="text-2xl sm:text-3xl font-black text-amber-600 block">100%</span>
          <span className="text-xs text-stone-500 font-medium">Single-Copy Unique Listings</span>
        </div>
      </section>

      {/* Curated Shelf: Best Deals (50%+ Off MRP) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-rose-600 text-xs font-black uppercase tracking-wider">
              <Percent className="w-4 h-4" />
              <span>Huge Savings</span>
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight mt-0.5">
              Best Deals (50%+ Off MRP)
            </h2>
            <p className="text-xs text-stone-500">Premium pre-owned books at half price or less</p>
          </div>

          <button
            onClick={onExploreMarketplace}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {(shelves.best_deals || []).slice(0, 4).map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={(b) => onSelectBook(b.id)}
            />
          ))}
        </div>
      </section>

      {/* Curated Shelf: Books Under ₹150 / ₹250 (Student Budget) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-wider">
              <Tag className="w-4 h-4" />
              <span>Pocket-Friendly</span>
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight mt-0.5">
              Budget Finds Under ₹250
            </h2>
            <p className="text-xs text-stone-500">Affordable reads for students on a budget</p>
          </div>

          <button
            onClick={onExploreMarketplace}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {(shelves.under_250 || []).slice(0, 4).map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={(b) => onSelectBook(b.id)}
            />
          ))}
        </div>
      </section>

      {/* Curated Shelf: Books Near You */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-teal-700 text-xs font-black uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Fast Courier Handover</span>
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight mt-0.5">
              Pre-Owned Books Near {pincodeCity}
            </h2>
            <p className="text-xs text-stone-500">Sellers located closest to your PIN code ({buyerPincode})</p>
          </div>

          <button
            onClick={onExploreMarketplace}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {(shelves.books_near_you || []).slice(0, 4).map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={(b) => onSelectBook(b.id)}
            />
          ))}
        </div>
      </section>

      {/* Curated Shelf: Recommended For You */}
      {shelves.recommended_for_you?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>AI Personalized</span>
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight mt-0.5">
                Recommended For Your Reading Tastes
              </h2>
              <p className="text-xs text-stone-500">Curated based on your browsing and purchase history</p>
            </div>

            <button
              onClick={onExploreMarketplace}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {shelves.recommended_for_you.slice(0, 4).map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={(b) => onSelectBook(b.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* How It Works 3-Step Guide */}
      <section className="bg-stone-100/70 border border-stone-200/80 rounded-3xl p-8 sm:p-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            How BookLoop Second-Hand Works
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            A trusted circular economy platform designed for students and passionate readers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="font-bold text-stone-900 text-base">List in 60 Seconds</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Upload book photos, select condition, and let Gemini AI suggest a competitive, fair second-hand resale price.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="font-bold text-stone-900 text-base">PIN-Code Distance & Shipping</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Our automated logistics engine calculates road distance, courier shipping fee, and estimated transit days dynamically.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-black text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="font-bold text-stone-900 text-base">Verified Condition Handover</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Buyers inspect condition and rate accuracy. Sellers earn money while saving books from dusty shelves.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
