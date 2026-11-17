import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getUserPincode, setUserPincode } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // Cart state stored in localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('bookloop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Buyer PIN code state
  const [buyerPincode, setPincodeState] = useState(() => getUserPincode());
  const [pincodeCity, setPincodeCity] = useState('Bengaluru');

  // Wishlist state
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistBookIds, setWishlistBookIds] = useState(new Set());

  // Save cart changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bookloop_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  // Sync PIN code city lookup
  useEffect(() => {
    let isMounted = true;
    api.lookupPincode(buyerPincode)
      .then(info => {
        if (isMounted && info && info.city) {
          setPincodeCity(info.city);
        }
      })
      .catch(() => {
        if (isMounted) setPincodeCity('India');
      });
    return () => { isMounted = false; };
  }, [buyerPincode]);

  // Fetch wishlist count when authenticated
  const refreshWishlist = async () => {
    if (!isAuthenticated) {
      setWishlistCount(0);
      setWishlistBookIds(new Set());
      return;
    }
    try {
      const items = await api.getWishlist();
      setWishlistCount(items.length);
      setWishlistBookIds(new Set(items.map(i => i.book_id)));
    } catch (err) {
      console.warn('Could not load wishlist:', err.message);
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, [isAuthenticated]);

  const updatePincode = (newPin) => {
    const clean = String(newPin).replace(/\D/g, '').slice(0, 6);
    if (clean.length === 6) {
      setUserPincode(clean);
      setPincodeState(clean);
    }
  };

  const addToCart = (book) => {
    if (!book || !book.id) return { success: false, message: 'Invalid book' };
    
    // Check if unique second-hand copy is already in cart
    if (cartItems.some(item => item.id === book.id)) {
      return { success: false, message: `'${book.title}' is already in your cart!` };
    }

    setCartItems(prev => [...prev, book]);
    return { success: true, message: `Added '${book.title}' to your cart!` };
  };

  const removeFromCart = (bookId) => {
    setCartItems(prev => prev.filter(item => item.id !== bookId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const toggleWishlist = async (bookId) => {
    if (!isAuthenticated) {
      throw new Error('Please login to save books to your wishlist.');
    }
    const res = await api.toggleWishlist(bookId);
    await refreshWishlist();
    return res;
  };

  const isBookWishlisted = (bookId) => {
    return wishlistBookIds.has(bookId);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount: cartItems.length,
        addToCart,
        removeFromCart,
        clearCart,
        buyerPincode,
        pincodeCity,
        updatePincode,
        wishlistCount,
        refreshWishlist,
        toggleWishlist,
        isBookWishlisted
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
