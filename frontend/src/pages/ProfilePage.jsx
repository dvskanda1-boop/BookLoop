import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { 
  User, Mail, Building, MapPin, 
  Coins, BookOpen, Save, CheckCircle2 
} from 'lucide-react';

export const ProfilePage = ({ onSuccess }) => {
  const { user, refreshUser } = useAuth();
  
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [location, setLocation] = useState('');
  
  const [favoriteCategories, setFavoriteCategories] = useState('');
  const [favoriteAuthors, setFavoriteAuthors] = useState('');
  const [preferredCondition, setPreferredCondition] = useState('Any');
  const [bio, setBio] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCollege(user.college || '');
      setLocation(user.location || '');
      if (user.preferences) {
        setFavoriteCategories(user.preferences.favorite_categories || '');
        setFavoriteAuthors(user.preferences.favorite_authors || '');
        setPreferredCondition(user.preferences.preferred_condition || 'Any');
        setBio(user.preferences.bio || '');
      }
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage(null);
    try {
      await api.updateProfile({ name, college, location });
      await refreshUser();
      setMessage('Profile details updated successfully!');
      onSuccess('Profile updated.');
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    setMessage(null);
    try {
      await api.updatePreferences({
        favorite_categories: favoriteCategories,
        favorite_authors: favoriteAuthors,
        preferred_condition: preferredCondition,
        bio
      });
      await refreshUser();
      setMessage('Reading preferences saved! BookLoop AI will use these for recommendations.');
      onSuccess('Preferences saved.');
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSavingPrefs(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-stone-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Profile & Preferences
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-1">
            Manage your campus contact info and fine-tune your AI book recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-900 self-start sm:self-auto">
          <Coins className="w-4 h-4 text-amber-600" />
          <span>{user.credit_balance} Available Credits</span>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-semibold ${
          message.startsWith('Error') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Basic Profile Form */}
        <form onSubmit={handleUpdateProfile} className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-100">
            <User className="w-4 h-4 text-emerald-700" />
            Campus Identity
          </h3>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">College Email (Fixed)</label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-xl bg-stone-100 text-stone-500 cursor-not-allowed font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">College / Institute</label>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g. National Institute of Technology"
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Campus Handover Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Hostel Block B / Central Library Floor 2"
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Updating...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>

        {/* AI Reading Preferences Form */}
        <form onSubmit={handleUpdatePreferences} className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-100">
            <BookOpen className="w-4 h-4 text-teal-700" />
            AI Reading & Matching Preferences
          </h3>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Favorite Categories / Subjects
            </label>
            <input
              type="text"
              value={favoriteCategories}
              onChange={(e) => setFavoriteCategories(e.target.value)}
              placeholder="e.g. Computer Science, Mathematics, Fiction"
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-stone-400 block mt-1">Comma-separated subjects used by AI recommendations.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Favorite Authors
            </label>
            <input
              type="text"
              value={favoriteAuthors}
              onChange={(e) => setFavoriteAuthors(e.target.value)}
              placeholder="e.g. Robert C. Martin, James Clear, Orwell"
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Preferred Minimum Book Condition
            </label>
            <select
              value={preferredCondition}
              onChange={(e) => setPreferredCondition(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
            >
              <option value="Any">Any Condition (Academic readable)</option>
              <option value="Good">Good or Better</option>
              <option value="Very Good">Very Good or Like New</option>
              <option value="Like New">Like New only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Student Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share what you study, topics you love, or semester interests..."
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPrefs}
              className="w-full py-2.5 text-xs font-bold text-teal-950 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4 text-teal-800" />
              <span>{savingPrefs ? 'Saving Preferences...' : 'Save AI Preferences'}</span>
            </button>
          </div>
        </form>

      </div>

    </div>
  );
};
