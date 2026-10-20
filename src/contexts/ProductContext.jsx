/* eslint react-refresh/only-export-components: off */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiRequest, authEndpoints } from '../services/api';

const ProductContext = createContext(null);

function toProductFormData(product) {
  const formData = new FormData();
  Object.entries(product).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (key === 'image' && typeof value === 'string') {
      formData.append(key, value);
    } else if (key === 'image' && value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
}

export function ProductProvider({ children }) {
  const { token } = useAuth();
  const [databaseProducts, setDatabaseProducts] = useState([]);
  const [databaseStatus, setDatabaseStatus] = useState({ token: null, loading: true, error: '' });
  const databaseError = databaseStatus.token === token ? databaseStatus.error : '';
  const isLoadingDatabase = databaseStatus.token !== token || databaseStatus.loading;
  const products = databaseProducts;

  useEffect(() => {
    let isCurrent = true;
    apiRequest(authEndpoints.products, { token })
      .then((payload) => {
        const result = payload?.data ?? payload;
        const fetchedProducts = Array.isArray(result)
          ? result
          : result?.products ?? result?.items ?? [];
        if (isCurrent) {
          setDatabaseProducts(fetchedProducts.map((product) => ({
            ...product,
            id: product.id ?? product._id,
            category: typeof product.category === 'string' ? product.category : product.category?.name || 'Others',
            source: 'database',
          })));
          setDatabaseStatus({ token, loading: false, error: '' });
        }
      })
      .catch((error) => {
        if (isCurrent) setDatabaseStatus({ token, loading: false, error: error.message });
      });
    return () => { isCurrent = false; };
  }, [token]);

  const addProduct = async (product) => {
    const payload = await apiRequest(authEndpoints.products, {
      method: 'POST',
      token,
      body: toProductFormData({
        ...product,
        price: Number(String(product.price).replaceAll(',', '')),
      }),
    });
    const result = payload?.data ?? payload;
    const savedProduct = result?.product ?? result;
    setDatabaseProducts((currentProducts) => [{
      ...product,
      ...(savedProduct && typeof savedProduct === 'object' ? savedProduct : {}),
      id: savedProduct?.id ?? savedProduct?._id ?? product.id,
      category: product.category,
      source: 'database',
    }, ...currentProducts]);
  };

  const updateProduct = async (productId, product) => {
    const payload = await apiRequest(`${authEndpoints.products}/${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      token,
      body: toProductFormData({
        ...product,
        price: Number(String(product.price).replaceAll(',', '')),
      }),
    });
    const result = payload?.data ?? payload;
    const savedProduct = result?.product ?? result;
    setDatabaseProducts((currentProducts) => currentProducts.map((item) => (
      item.id === productId
        ? { ...item, ...product, ...(savedProduct && typeof savedProduct === 'object' ? savedProduct : {}), category: product.category, id: productId, source: 'database' }
        : item
    )));
  };

  const removeProduct = async (product) => {
    await apiRequest(`${authEndpoints.products}/${encodeURIComponent(product.id)}`, {
      method: 'DELETE',
      token,
    });
    setDatabaseProducts((currentProducts) => currentProducts.filter((item) => item.id !== product.id));
  };

  const getProductsByCategory = (category) =>
    products.filter((product) => product.category === category);

  return (
    <ProductContext.Provider value={{
      products,
      databaseProducts,
      addProduct,
      updateProduct,
      removeProduct,
      getProductsByCategory,
      databaseError,
      isLoadingDatabase,
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
}