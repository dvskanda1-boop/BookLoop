import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Tag, CheckCircle2, AlertCircle, ArrowRight, 
  MapPin, Image, BookOpen, Layers, Weight, ShieldCheck, 
  HelpCircle, RefreshCw 
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BookCard } from '../components/BookCard';

export const SellBookPage = ({ onBookCreated, onCancel }) => {
  const { user, isAuthenticated } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState('Very Good');
  const [originalPrice, setOriginalPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [edition, setEdition] = useState('Standard Edition');
  const [publicationYear, setPublicationYear] = useState('2021');
  const [pages, setPages] = useState('320');
  const [weightGrams, setWeightGrams] = useState('450');
  const [pickupPincode, setPickupPincode] = useState(user?.pincode || '560001');
  const [pickupCity, setPickupCity] = useState(user?.city || 'Bengaluru');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400');

  // AI Recommendation State
  const [aiRecommending, setAiRecommending] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    api.getCategories()
      .then(cats => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      })
      .catch(err => console.warn('Could not load categories:', err.message))
      .finally(() => setLoadingCategories(false));
  }, []);

  // Price calculations
  const numOriginal = parseFloat(originalPrice) || 0;
  const numSelling = parseFloat(sellingPrice) || 0;
  const isPriceInvalid = numOriginal > 0 && numSelling >= numOriginal;
  const savings = Math.max(0, numOriginal - numSelling);
  const discountPercent = numOriginal > 0 ? Math.round(((numOriginal - numSelling) / numOriginal) * 100) : 0;

  // AI Pricing Tool invocation
  const handleGetAIPricing = async () => {
    if (!title.trim() || numOriginal <= 0) {
      alert('Please enter Book Title and Original Price (MRP) first to get AI pricing recommendation.');
      return;
    }

    setAiRecommending(true);
    setAiError(null);
    setAiRecommendation(null);

    const selectedCat = categories.find(c => String(c.id) === String(categoryId));

    try {
      const res = await api.recommendPrice({
        title: title.trim(),
        author: author.trim() || undefined,
        isbn: isbn.trim() || undefined,
        original_price: numOriginal,
        condition: condition,
        edition: edition.trim() || undefined,
        publication_year: parseInt(publicationYear) || 2021,
        category: selectedCat ? selectedCat.name : undefined
      });
      setAiRecommendation(res);
    } catch (err) {
      setAiError(err.message || 'AI pricing service temporarily unavailable.');
    } finally {
      setAiRecommending(false);
    }
  };

  const handleApplyAIFairPrice = (price) => {
    setSellingPrice(String(price));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to list books for sale.');
      return;
    }

    if (numSelling >= numOriginal) {
      setFormError('As a second-hand marketplace, selling price must be strictly lower than original retail MRP.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const newBook = await api.createBook({
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim() || null,
        category_id: parseInt(categoryId),
        condition: condition,
        original_price: numOriginal,
        selling_price: numSelling,
        edition: edition.trim() || 'Standard Edition',
        publication_year: parseInt(publicationYear) || 2021,
        pages: parseInt(pages) || 300,
        weight_grams: parseInt(weightGrams) || 450,
        pickup_pincode: pickupPincode.trim(),
        pickup_city: pickupCity.trim(),
        description: description.trim() || 'Second-hand book in great reading condition.',
        image_url: imageUrl.trim()
      });

      alert(`Success! "${newBook.title}" is now listed on the BookLoop second-hand marketplace.`);
      if (onBookCreated) {
        onBookCreated(newBook);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to list book. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const previewBook = {
    id: 999999,
    title: title || 'Title of Your Book',
    author: author || 'Author Name',
    category_name: categories.find(c => String(c.id) === String(categoryId))?.name || 'General',
    condition: condition,
    original_price: numOriginal || 600,
    selling_price: numSelling || 250,
    discount_percent: discountPercent > 0 ? discountPercent : 58,
    pickup_city: pickupCity || 'Bengaluru',
    pickup_pincode: pickupPincode || '560001',
    image_url: imageUrl,
    is_sold: false
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
          Second-Life Marketplace
        </span>
        <h1 className="text-3xl font-extrabold text-stone-900 mt-2 tracking-tight">
          Sell Your Book & Empower Another Reader
        </h1>
        <p className="text-stone-600 text-sm mt-1 max-w-2xl italic">
          "Don't let a good book sit on a shelf. Give it a second life, and let someone else enjoy the story at a lower price."
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form Column (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
          
          {formError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Book Information</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Book Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Introduction to Algorithms"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Author Name *</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Thomas H. Cormen"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ISBN Number (Optional)</label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="e.g. 9780262033848"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Book Condition Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">Book Condition *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { name: 'Like New', desc: 'No marks, crisp pages' },
                  { name: 'Very Good', desc: 'Minimal wear, clean' },
                  { name: 'Good', desc: 'Normal wear, highlighted' },
                  { name: 'Acceptable', desc: 'Readable, shelf wear' }
                ].map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setCondition(c.name)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      condition === c.name
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <span className="block text-xs font-bold text-stone-900">{c.name}</span>
                    <span className="text-[10px] text-stone-500 block mt-0.5">{c.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing & AI Smart Assistant Section */}
            <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-700" />
                  <span>Fair Pricing & AI Resale Valuation</span>
                </h3>

                <button
                  type="button"
                  onClick={handleGetAIPricing}
                  disabled={aiRecommending}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiRecommending ? 'Analyzing...' : 'Ask AI Price Advice'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Original Price / MRP (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="e.g. 750"
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Your Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="e.g. 320"
                    className={`w-full p-2.5 bg-white border rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden ${
                      isPriceInvalid ? 'border-rose-500 ring-2 ring-rose-200' : 'border-stone-300 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* Dynamic Price Rule Feedback */}
              {isPriceInvalid && (
                <div className="mt-3 p-3 bg-rose-100/80 border border-rose-300 rounded-xl text-xs text-rose-900 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Rule Violation: Selling price must be strictly lower than original retail MRP (₹{numOriginal}).</span>
                </div>
              )}

              {numOriginal > 0 && numSelling > 0 && !isPriceInvalid && (
                <div className="mt-3 flex items-center gap-4 text-xs font-bold text-emerald-800">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Buyer Saves: ₹{savings}
                  </span>
                  <span>Discount: {discountPercent}% OFF</span>
                </div>
              )}

              {/* AI Recommendation Output Card */}
              {aiRecommendation && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-teal-200 shadow-xs animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-teal-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      Gemini AI Recommended Resale Price
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyAIFairPrice(aiRecommendation.recommended_selling_price)}
                      className="px-2.5 py-1 bg-teal-100 hover:bg-teal-200 text-teal-900 rounded-lg text-xs font-bold transition-colors"
                    >
                      Apply ₹{aiRecommendation.recommended_selling_price}
                    </button>
                  </div>

                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-xl font-black text-emerald-700">
                      ₹{aiRecommendation.recommended_selling_price}
                    </span>
                    <span className="text-xs text-stone-500">
                      Fair Range: ₹{aiRecommendation.suggested_min_price} - ₹{aiRecommendation.suggested_max_price}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 italic">
                    "{aiRecommendation.pricing_rationale}"
                  </p>
                </div>
              )}
            </div>

            {/* Edition, Year, Pages & Logistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Edition</label>
                <input
                  type="text"
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  placeholder="3rd Edition"
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Pub. Year</label>
                <input
                  type="number"
                  value={publicationYear}
                  onChange={(e) => setPublicationYear(e.target.value)}
                  placeholder="2021"
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Pickup PIN *</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={pickupPincode}
                  onChange={(e) => setPickupPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="560001"
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Pickup City *</label>
                <input
                  type="text"
                  required
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                  placeholder="Bengaluru"
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Image URL & Description */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Book Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Seller Description & Physical Condition Notes</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe markings, spine condition, highlighting or any missing pages..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Submit & Cancel */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-5 py-2.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={submitting || isPriceInvalid}
                className={`px-8 py-3 rounded-xl text-xs font-extrabold text-white shadow-md transition-all flex items-center gap-2 ${
                  isPriceInvalid || submitting
                    ? 'bg-stone-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800'
                }`}
              >
                <span>{submitting ? 'Listing Book...' : 'Publish Pre-Owned Listing'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Preview Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-3">
              Live Buyer Preview
            </h3>
            
            <BookCard book={previewBook} />

            <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600">
              <h4 className="font-bold text-stone-800 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Seller Guidelines
              </h4>
              <ul className="space-y-1 text-[11px] text-stone-500">
                <li>• Ensure images accurately reflect any cover or corner wear.</li>
                <li>• Books are locked from sale once an order is placed.</li>
                <li>• Pack securely and ship to the buyer's PIN code.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
