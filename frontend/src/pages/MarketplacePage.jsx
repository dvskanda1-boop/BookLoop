import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, SlidersHorizontal, ArrowUpDown, 
  Tag, Percent, MapPin, X, BookOpen, AlertCircle, RefreshCw 
} from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { BookCard } from '../components/BookCard';

export const MarketplacePage = ({ onSelectBook, initialSearchQuery = '' }) => {
  const { buyerPincode, pincodeCity } = useCart();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [search, setSearch] = useState(initialSearchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [maxPrice, setMaxPrice] = useState('');
  const [minDiscount, setMinDiscount] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Load Categories on mount
  useEffect(() => {
    api.getCategories()
      .then(cats => setCategories(Array.isArray(cats) ? cats : []))
      .catch(() => setCategories([]));
  }, []);

  // Update search if initialSearchQuery changes from Navbar
  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearch(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Fetch Books with all filters
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      api.getBooks({
        search: search.trim() || undefined,
        category_id: selectedCategory ? parseInt(selectedCategory) : undefined,
        condition: selectedCondition !== 'All' ? selectedCondition : undefined,
        max_price: maxPrice ? parseFloat(maxPrice) : undefined,
        min_discount: minDiscount ? parseFloat(minDiscount) : undefined,
        sort_by: sortBy,
        available_only: true,
        limit: 50
      })
      .then(data => {
        if (isMounted) setBooks(Array.isArray(data) ? data : (data?.books || []));
      })
      .catch(err => {
        if (isMounted) setError(err.message || 'Failed to load books.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, selectedCategory, selectedCondition, maxPrice, minDiscount, sortBy]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedCondition('All');
    setMaxPrice('');
    setMinDiscount('');
    setSortBy('newest');
  };

  const hasActiveFilters = search || selectedCategory || selectedCondition !== 'All' || maxPrice || minDiscount || sortBy !== 'newest';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-emerald-600" />
            <span>Pre-Owned Book Marketplace</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Browse verified second-hand books at up to 75% off original retail MRP.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Delivery to: <strong>{pincodeCity} ({buyerPincode})</strong></span>
        </div>
      </div>

      {/* Filter & Search Control Panel */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-4">
        
        {/* Row 1: Search & Sorting */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by book title, author, or ISBN..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-bold text-stone-600 shrink-0 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-auto py-2.5 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="discount_desc">Biggest Discount %</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Row 2: Category, Condition, Budget & Discount Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-stone-100">
          
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">Condition</label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800"
            >
              <option value="All">All Conditions</option>
              <option value="Like New">Like New</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Acceptable">Acceptable</option>
            </select>
          </div>

          {/* Budget Presets */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">Max Price</label>
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800"
            >
              <option value="">Any Budget</option>
              <option value="150">Under ₹150</option>
              <option value="250">Under ₹250</option>
              <option value="400">Under ₹400</option>
              <option value="600">Under ₹600</option>
            </select>
          </div>

          {/* Min Discount Presets */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">Min Discount</label>
            <select
              value={minDiscount}
              onChange={(e) => setMinDiscount(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800"
            >
              <option value="">All Discounts</option>
              <option value="30">30%+ Off MRP</option>
              <option value="50">50%+ Off MRP</option>
              <option value="60">60%+ Off MRP</option>
            </select>
          </div>

        </div>

        {/* Clear Filters indicator */}
        {hasActiveFilters && (
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-stone-500 font-medium">
              Showing filtered results ({books.length} books found)
            </span>
            <button
              onClick={handleClearFilters}
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}

      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-stone-500 font-semibold">Filtering second-hand books...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center text-xs text-rose-700 max-w-lg mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="font-bold">{error}</p>
        </div>
      ) : books.length === 0 ? (
        <div className="py-16 text-center bg-stone-50 rounded-3xl border border-stone-200 p-8 max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900">No Pre-Owned Books Found</h3>
          <p className="text-xs text-stone-500 mt-1 mb-4">
            No listings matched your active search and filter criteria.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={(b) => onSelectBook(b.id)}
            />
          ))}
        </div>
      )}

    </div>
  );
};
