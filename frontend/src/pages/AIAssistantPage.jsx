import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  Sparkles, Send, Bot, User, ArrowLeftRight, 
  BookOpen, Coins, CheckCircle, RefreshCw, AlertCircle, 
  Tag, MapPin, Truck, ShoppingCart 
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "Find pre-owned books under ₹200",
  "What price should I sell my engineering textbook for?",
  "Estimate delivery charge from 560001 to 570001",
  "Show me the best deals with over 50% discount",
  "Recommend books for computer science students",
  "How many exchange credits do I have?"
];

export const AIAssistantPage = ({ onSelectBook, initialPrompt = '' }) => {
  const { user, refreshUser } = useAuth();
  const { buyerPincode, addToCart } = useCart();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user ? user.name.split(' ')[0] : 'fellow reader'}! 👋 I am your **BookLoop AI Assistant**, powered by Gemini with live tools connected to our pre-owned book marketplace.\n\nI can:\n- **Find pre-owned books** by title, author, or student budget\n- **Recommend fair resale prices** for books you want to sell\n- **Calculate courier road distance & delivery charges** between PIN codes\n- **Discover best deals** with huge savings below original retail MRP\n\nWhat would you like to explore today?`,
      tools_used: [],
      book_cards: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const chatBottomRef = useRef(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = async (messageToSend) => {
    const text = (messageToSend || inputMessage).trim();
    if (!text || isThinking) return;

    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      tools_used: [],
      book_cards: []
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsThinking(true);

    try {
      const response = await api.chatWithAI(text, sessionId, buyerPincode);
      if (response.session_id && !sessionId) {
        setSessionId(response.session_id);
      }

      if (response.tools_used?.includes('check_user_credits')) {
        refreshUser();
      }

      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        tools_used: response.tools_used || [],
        book_cards: response.book_cards || []
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I encountered an issue: ${err.message || 'Please check your connection and try again.'}`,
          tools_used: [],
          book_cards: []
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-5rem)] flex flex-col">
      
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center shadow-md shadow-teal-700/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <span>BookLoop AI Second-Hand Assistant</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                Gemini 3.5
              </span>
            </h1>
            <p className="text-xs text-stone-500">
              Live backend tools for search, distance-based delivery estimation, and AI resale pricing
            </p>
          </div>
        </div>

        {user && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold text-amber-900">
            <Coins className="w-4 h-4 text-amber-600" />
            <span>{user.credit_balance} Credits</span>
          </div>
        )}
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 bg-stone-50/60 rounded-3xl border border-stone-200/90 p-4 sm:p-6 overflow-y-auto space-y-4 shadow-inner">
        {messages.map((msg) => {
          const isAI = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                  isAI
                    ? 'bg-gradient-to-br from-teal-600 to-emerald-700 text-white'
                    : 'bg-stone-800 text-white'
                }`}
              >
                {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className="space-y-2">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isAI
                      ? 'bg-white text-stone-800 border border-stone-200/90 shadow-xs'
                      : 'bg-emerald-600 text-white shadow-xs font-medium'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Tool Call Badges */}
                  {msg.tools_used && msg.tools_used.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-stone-400 font-bold uppercase">Backend Tools:</span>
                      {msg.tools_used.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-mono font-semibold"
                        >
                          ⚡ {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attached Interactive Book Cards */}
                {msg.book_cards && msg.book_cards.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {msg.book_cards.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs flex gap-3 items-center hover:border-emerald-500 transition-colors"
                      >
                        <img
                          src={b.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200'}
                          alt={b.title}
                          className="w-14 h-18 object-cover rounded-xl bg-stone-100 border border-stone-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase block truncate">
                            {b.condition} • {b.category_name}
                          </span>
                          <h4 className="font-bold text-stone-900 text-xs truncate" title={b.title}>{b.title}</h4>
                          <p className="text-[11px] text-stone-500 truncate">by {b.author}</p>
                          
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-sm font-black text-stone-900">₹{Math.round(b.selling_price || 0)}</span>
                            {b.original_price > b.selling_price && (
                              <span className="text-[10px] text-stone-400 line-through">₹{Math.round(b.original_price)}</span>
                            )}
                            {b.discount_percent > 0 && (
                              <span className="text-[10px] text-rose-600 font-bold">
                                {Math.round(b.discount_percent)}% off
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex gap-1.5">
                            <button
                              onClick={() => onSelectBook && onSelectBook(b.id)}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[10px] font-bold"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => {
                                const res = addToCart(b);
                                alert(res.message);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-stone-500 font-medium ml-1">
                Consulting marketplace database & executing tools...
              </span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="py-2.5 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        <span className="text-[10px] font-bold text-stone-400 uppercase shrink-0">Try Asking:</span>
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={isThinking}
            className="px-3 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-full text-xs text-stone-600 hover:text-emerald-700 font-medium whitespace-nowrap shadow-xs transition-colors shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative shrink-0"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask AI anything about pre-owned books, resale prices, or courier delivery..."
          disabled={isThinking}
          className="w-full pl-4 pr-12 py-3.5 bg-white border border-stone-300 rounded-2xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isThinking}
          className={`absolute right-2 top-2 bottom-2 px-4 rounded-xl flex items-center justify-center transition-all ${
            inputMessage.trim() && !isThinking
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm hover:scale-105'
              : 'bg-stone-100 text-stone-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
