import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, BookOpen, User, MapPin, Building, 
  ArrowLeftRight, CheckCircle2, ShieldCheck, Tag, Globe 
} from 'lucide-react';

export const BookDetailModal = ({ book, onClose, onRequestExchange }) => {
  const { user } = useAuth();
  if (!book) return null;

  const isOwner = user && user.id === book.owner_id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100 bg-stone-50/70">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Book Details & Verified Campus Listing
          </span>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Col 1: Book Image & Status */}
          <div className="space-y-3">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100">
              <img
                src={book.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400';
                }}
              />
            </div>

            <div className="text-center">
              {book.is_available ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Available for Exchange
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                  Currently In Exchange
                </span>
              )}
            </div>
          </div>

          {/* Col 2 & 3: Details, Description, Owner info */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                {book.category_name}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5 leading-snug">
                {book.title}
              </h2>
              <p className="text-sm text-stone-600 font-medium">
                Written by <span className="text-slate-900 font-bold">{book.author}</span>
              </p>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg font-semibold border border-stone-200">
                Condition: <strong className="text-emerald-700">{book.condition}</strong>
              </div>
              <div className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg font-semibold border border-stone-200 flex items-center gap-1">
                <Globe className="w-3 h-3 text-stone-500" /> {book.language || 'English'}
              </div>
              {book.isbn && (
                <div className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg font-mono text-[11px] border border-stone-200">
                  ISBN: {book.isbn}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                About this book
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200/60 max-h-32 overflow-y-auto">
                {book.description || 'No description provided by the student.'}
              </p>
            </div>

            {/* Owner & Campus Location Card */}
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Student & Pickup Location
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-stone-700">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="font-semibold truncate">{book.owner_name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-700">
                  <Building className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="truncate">{book.owner_college}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1.5 text-stone-700">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="truncate">{book.owner_location}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={onClose}
                className="py-2.5 px-4 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              >
                Close
              </button>

              {book.is_available && !isOwner && (
                <button
                  onClick={() => {
                    onClose();
                    onRequestExchange(book);
                  }}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Request Book Exchange (2 Credits)</span>
                </button>
              )}

              {isOwner && (
                <div className="flex-1 text-center py-2 text-xs font-bold text-purple-700 bg-purple-50 rounded-xl border border-purple-200">
                  This book is currently in your Bookshelf
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
