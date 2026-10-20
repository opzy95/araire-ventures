/* eslint react-refresh/only-export-components: off */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { apiRequest, authEndpoints } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const GUEST_CART_KEY = 'cart';

function getPrice(value) {
  const price = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(price) ? price : 0;
}

function normalizeCart(payload) {
  let result = payload?.data ?? payload ?? {};
  if (result.cart) result = result.cart;

  const rows = Array.isArray(result) ? result : result.items ?? [];
  const items = rows.map((row) => {
    const populatedProduct = row.product && typeof row.product === 'object'
      ? row.product
      : row.productId && typeof row.productId === 'object'
        ? row.productId
        : null;
    const product = populatedProduct ?? row;
    const id = product.id ?? product._id ?? row.productId ?? row.id;
    return {
      ...product,
      id,
      quantity: Number(row.quantity) || 1,
    };
  }).filter((item) => item.id !== undefined && item.id !== null);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const calculatedSubtotal = items.reduce((total, item) => total + getPrice(item.price) * item.quantity, 0);
  const totalItems = Number(result.totalItems);
  const subtotal = result.subtotal === undefined ? Number.NaN : getPrice(result.subtotal);

  return {
    items,
    totalItems: Number.isFinite(totalItems) ? totalItems : itemCount,
    subtotal: Number.isFinite(subtotal) ? subtotal : calculatedSubtotal,
  };
}

function getGuestCart() {
  const savedCart = localStorage.getItem(GUEST_CART_KEY);
  if (!savedCart) return normalizeCart([]);

  const parsedCart = JSON.parse(savedCart);
  if (!Array.isArray(parsedCart)) {
    throw new Error('Saved cart data is invalid. Clear your browser cart data and try again.');
  }
  return normalizeCart(parsedCart);
}

function saveGuestCart(items) {
  if (items.length) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  else localStorage.removeItem(GUEST_CART_KEY);
}

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    totalItems: 0,
    subtotal: 0,
    loading: true,
    error: '',
    loadError: '',
  });
  const activeTokenRef = useRef(token);
  const guestHydratedRef = useRef(false);
  const mutationQueueRef = useRef(Promise.resolve());
  const mutationRevisionRef = useRef(0);

  activeTokenRef.current = token;

  useEffect(() => {
    let isCurrent = true;
    const revision = mutationRevisionRef.current;
    guestHydratedRef.current = false;
    setCart((current) => ({
      ...current,
      items: [],
      totalItems: 0,
      subtotal: 0,
      loading: true,
      error: '',
      loadError: '',
    }));

    const applyCart = (payload) => {
      if (!isCurrent || revision !== mutationRevisionRef.current) return;
      setCart({ ...normalizeCart(payload), loading: false, error: '', loadError: '' });
    };

    if (token) {
      const loadAndMergeCart = async () => {
        const guestCart = getGuestCart();
        let serverCart = normalizeCart(await apiRequest(authEndpoints.cart, { token }));
        let remainingGuestItems = guestCart.items;

        for (const guestItem of guestCart.items) {
          if (!isCurrent || revision !== mutationRevisionRef.current) return;
          const existingItem = serverCart.items.find((item) => String(item.id) === String(guestItem.id));
          const url = existingItem
            ? `${authEndpoints.cartItems}/${encodeURIComponent(guestItem.id)}`
            : authEndpoints.cartItems;
          const options = existingItem
            ? { method: 'PATCH', body: { quantity: existingItem.quantity + guestItem.quantity } }
            : { method: 'POST', body: { productId: guestItem.id, quantity: guestItem.quantity } };
          await apiRequest(url, { ...options, token });

          remainingGuestItems = remainingGuestItems.filter(
            (item) => String(item.id) !== String(guestItem.id),
          );
          saveGuestCart(remainingGuestItems);
          serverCart = normalizeCart([
            ...serverCart.items.filter((item) => String(item.id) !== String(guestItem.id)),
            { ...(existingItem ?? guestItem), quantity: (existingItem?.quantity ?? 0) + guestItem.quantity },
          ]);
        }

        applyCart(await apiRequest(authEndpoints.cart, { token }));
      };

      loadAndMergeCart().catch((error) => {
          if (isCurrent && revision === mutationRevisionRef.current) {
            setCart({ items: [], totalItems: 0, subtotal: 0, loading: false, error: '', loadError: error.message });
          }
        });
    } else {
      try {
        const guestCart = getGuestCart();
        guestHydratedRef.current = true;
        applyCart(guestCart);
      } catch (error) {
        if (isCurrent) setCart({ items: [], totalItems: 0, subtotal: 0, loading: false, error: '', loadError: error.message });
      }
    }

    return () => { isCurrent = false; };
  }, [token]);

  useEffect(() => {
    if (token || !guestHydratedRef.current) return;
    try {
      saveGuestCart(cart.items);
    } catch (error) {
      setCart((current) => ({ ...current, error: `Could not save your cart: ${error.message}` }));
    }
  }, [cart.items, token]);

  const updateCartFromServer = async (requestToken, revision) => {
    if (activeTokenRef.current !== requestToken) {
      throw new Error('Your session changed. Please try the cart action again.');
    }
    const result = await apiRequest(authEndpoints.cart, { token: requestToken });
    if (activeTokenRef.current === requestToken && revision === mutationRevisionRef.current) {
      setCart({ ...normalizeCart(result), loading: false, error: '', loadError: '' });
    }
  };

  const refreshCart = async () => {
    if (!token) return;
    const requestToken = token;
    const result = await apiRequest(authEndpoints.cart, { token: requestToken });
    if (activeTokenRef.current === requestToken) {
      setCart({ ...normalizeCart(result), loading: false, error: '', loadError: '' });
    }
  };

  const runServerMutation = (requestToken, url, options) => {
    const revision = mutationRevisionRef.current + 1;
    mutationRevisionRef.current = revision;
    setCart((current) => ({ ...current, error: '' }));
    const operation = mutationQueueRef.current.then(async () => {
      if (activeTokenRef.current !== requestToken) {
        throw new Error('Your session changed. Please try the cart action again.');
      }
      await apiRequest(url, { ...options, token: requestToken });
      try {
        await updateCartFromServer(requestToken, revision);
      } catch (error) {
        throw new Error(`Your cart change was saved, but the cart could not be refreshed: ${error.message}`);
      }
    });

    mutationQueueRef.current = operation.catch(() => {});
    return operation.catch((error) => {
      if (activeTokenRef.current === requestToken && revision === mutationRevisionRef.current) {
        setCart((current) => ({ ...current, error: error.message }));
      }
      throw error;
    });
  };

  const addToCart = (product, quantity = 1) => {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return Promise.reject(new Error('Quantity must be a positive whole number.'));
    }
    if (product?.id === undefined || product.id === null || product.id === '') {
      return Promise.reject(new Error('This product is missing its ID and cannot be added to the cart.'));
    }

    if (token) {
      return runServerMutation(token, authEndpoints.cartItems, {
        method: 'POST',
        body: { productId: product.id, quantity },
      });
    }

    setCart((current) => {
      const existingItem = current.items.find((item) => item.id === product.id);
      const items = existingItem
        ? current.items.map((item) => (
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        ))
        : [...current.items, { ...product, quantity }];
      return {
        ...current,
        items,
        totalItems: current.totalItems + quantity,
        subtotal: current.subtotal + getPrice(product.price) * quantity,
        error: '',
      };
    });
    return Promise.resolve();
  };

  const removeFromCart = (productId) => {
    if (token) {
      return runServerMutation(token, `${authEndpoints.cartItems}/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });
    }
    setCart((current) => {
      const removedItem = current.items.find((item) => item.id === productId);
      const items = current.items.filter((item) => item.id !== productId);
      return {
        ...current,
        items,
        totalItems: Math.max(0, current.totalItems - (removedItem?.quantity ?? 0)),
        subtotal: Math.max(0, current.subtotal - (removedItem ? getPrice(removedItem.price) * removedItem.quantity : 0)),
        error: '',
      };
    });
    return Promise.resolve();
  };

  const updateQuantity = (productId, quantity) => {
    if (!Number.isInteger(quantity) || quantity < 0) {
      return Promise.reject(new Error('Quantity must be a non-negative whole number.'));
    }
    if (quantity === 0) return removeFromCart(productId);

    if (token) {
      return runServerMutation(token, `${authEndpoints.cartItems}/${encodeURIComponent(productId)}`, {
        method: 'PATCH',
        body: { quantity },
      });
    }

    setCart((current) => {
      const previousItem = current.items.find((item) => item.id === productId);
      const items = current.items.map((item) => (
        item.id === productId ? { ...item, quantity } : item
      ));
      const previousQuantity = previousItem?.quantity ?? 0;
      return {
        ...current,
        items,
        totalItems: Math.max(0, current.totalItems + quantity - previousQuantity),
        subtotal: Math.max(0, current.subtotal + getPrice(previousItem?.price) * (quantity - previousQuantity)),
        error: '',
      };
    });
    return Promise.resolve();
  };

  const clearCart = () => {
    if (token) {
      return runServerMutation(token, authEndpoints.cart, { method: 'DELETE' });
    }
    setCart((current) => ({ ...current, items: [], totalItems: 0, subtotal: 0, error: '' }));
    return Promise.resolve();
  };

  const getTotalPrice = () => cart.subtotal;
  const getTotalItems = () => cart.totalItems;

  return (
    <CartContext.Provider value={{
      ...cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      refreshCart,
      getTotalPrice,
      getTotalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
