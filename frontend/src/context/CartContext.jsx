import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) { setItems([]); return; }
    try {
      setLoading(true);
      const data = await api.getCart();
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addToCart = async (productId, quantity = 1) => {
    await api.addToCart(productId, quantity);
    await fetchCart();
  };

  const updateQuantity = async (itemId, quantity) => {
    await api.updateCartItem(itemId, quantity);
    await fetchCart();
  };

  const removeItem = async (itemId) => {
    await api.removeCartItem(itemId);
    await fetchCart();
  };

  const clearCart = async () => {
    await api.clearCart();
    setItems([]);
  };

  const getItemQuantity = useCallback((productId) => {
    const item = items.find(i => i.product_id === productId || i.id === productId);
    return item ? item.quantity : 0;
  }, [items]);

  const incrementItem = async (productId) => {
    const item = items.find(i => i.product_id === productId || i.id === productId);
    if (item) {
      await updateQuantity(item.id, item.quantity + 1);
    } else {
      await addToCart(productId, 1);
    }
  };

  const decrementItem = async (productId) => {
    const item = items.find(i => i.product_id === productId || i.id === productId);
    if (!item) return;
    if (item.quantity > 1) {
      await updateQuantity(item.id, item.quantity - 1);
    } else {
      await removeItem(item.id);
    }
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = cartTotal > 299 ? 0 : (cartTotal > 0 ? 49 : 0);
  const grandTotal = cartTotal + deliveryFee;

  return (
    <CartContext.Provider value={{
      items, loading, cartCount, cartTotal: Math.round(cartTotal * 100) / 100,
      deliveryFee, grandTotal: Math.round(grandTotal * 100) / 100,
      fetchCart, addToCart, updateQuantity, removeItem, clearCart,
      getItemQuantity, incrementItem, decrementItem
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
