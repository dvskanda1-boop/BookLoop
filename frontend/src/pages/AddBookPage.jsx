import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  PlusCircle, BookOpen, Image as ImageIcon, 
  CheckCircle2, ArrowLeft, Sparkles, Tag 
} from 'lucide-react';

const PRESET_COVERS = [
  { label: 'CS & Tech', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400' },
  { label: 'Code & Software', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400' },
  { label: 'Algorithms & Math', url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=400' },
  { label: 'Literature Classic', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400' },
  { label: 'Self-Help Growth', url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400' },
  { label: 'Business & Finance', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400' }
];

export const AddBookPage = ({ setActivePage, onSuccess }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState('Like New');
  const [language, setLanguage] = useState('English');
  const [isbn, setIsbn] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_COVERS[0].url);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getCategories()
      .then(cats => {
        const safeCats = Array.isArray(cats) ? cats : [];
        setCategories(safeCats);
        if (safeCats.length > 0) setCategoryId(safeCats[0].id);
      })
      .catch(err => console.warn(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !categoryId) {
      setError('Please provide book title, author, and category.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.createBook({
        title: title.trim(),
        author: author.trim(),
        category_id: parseInt(categoryId),
        condition,
        language,
        isbn: isbn.trim() || null,
        description: description.trim() || null,
        image_url: imageUrl.trim() || PRESET_COVERS[0].url
      });
      onSuccess(`"${title}" has been successfully listed on your bookshelf!`);
      setActivePage('bookshelf');
    } catch (err) {
      setError(err.message || 'Failed to list book.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-5">
        <div>
          <button
            onClick={() => setActivePage('bookshelf')}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Bookshelf</span>
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            List a Book for Campus Exchange
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-1">
            Share pre-loved textbooks or novels with fellow college students.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
              Book Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Operating System Concepts"
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                Author *
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Silberschatz & Galvin"
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                Physical Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="Like New">Like New (Pristine, no marks)</option>
                <option value="Very Good">Very Good (Clean, minor shelf wear)</option>
                <option value="Good">Good (Readable, occasional highlights)</option>
                <option value="Fair">Fair (Well-loved, intact pages)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                ISBN (Optional)
              </label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="e.g. 9781118063330"
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
              Book Cover Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono text-[11px]"
            />
            {/* Presets */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-stone-500 uppercase mr-1">Quick Covers:</span>
              {PRESET_COVERS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setImageUrl(preset.url)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                    imageUrl === preset.url ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
              Description & Edition Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mention semester, highlights, or topics covered..."
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              {loading ? (
                <span>Publishing to Marketplace...</span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish Book to Bookshelf</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-stone-100/60 p-5 rounded-3xl border border-stone-200">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Live Marketplace Preview Card
            </h3>
            <div className="max-w-xs mx-auto bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="aspect-[4/3] bg-stone-200 overflow-hidden relative">
                <img
                  src={imageUrl || PRESET_COVERS[0].url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = PRESET_COVERS[0].url; }}
                />
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {condition}
                </span>
                <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  Available
                </span>
              </div>
              <div className="p-4 space-y-2">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  {categories.find(c => c.id === parseInt(categoryId))?.name || 'Category'}
                </span>
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {title || 'Book Title Here'}
                </h4>
                <p className="text-xs text-stone-500 truncate">
                  by {author || 'Author Name'}
                </p>
                <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-600">
                  Listed by <strong>{user?.name || 'You'}</strong> ({user?.location || 'Campus'})
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
