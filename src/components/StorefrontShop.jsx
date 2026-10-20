import React, { useMemo, useState } from 'react';
import { FiBox, FiPlus, FiSearch, FiShoppingCart } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../contexts/ProductContext';
import { useToast } from '../contexts/ToastContext';
import './StorefrontShop.css';

function formatPrice(value) {
  const amount = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return `₦${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-NG')}`;
}

function StorefrontShop() {
  const { products, databaseError, isLoadingDatabase } = useProducts();
  const { addToCart, getTotalItems } = useCart();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [sort, setSort] = useState('featured');

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matchingProducts = products.filter((product) => (
      (category === 'All categories' || product.category === category)
      && (!query || product.name?.toLowerCase().includes(query))
    ));

    if (sort === 'price-low') {
      return matchingProducts.sort((a, b) => Number(String(a.price).replace(/[^\d.-]/g, '')) - Number(String(b.price).replace(/[^\d.-]/g, '')));
    }
    if (sort === 'price-high') {
      return matchingProducts.sort((a, b) => Number(String(b.price).replace(/[^\d.-]/g, '')) - Number(String(a.price).replace(/[^\d.-]/g, '')));
    }
    if (sort === 'name') {
      return matchingProducts.sort((a, b) => a.name.localeCompare(b.name));
    }
    return matchingProducts;
  }, [products, search, category, sort]);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product);
      addToast(`${product.name} added to your cart.`, 'success');
    } catch (error) {
      addToast(`Could not add ${product.name}: ${error.message}`, 'error');
    }
  };

  return (
    <main className="storefront-shop">
      <section className="storefront-shop-heading">
        <div>
          <p className="storefront-shop-eyebrow">THE ARAIRE COLLECTION</p>
          <h1>Find something lovely for home.</h1>
          <p>Browse practical essentials and thoughtful finds for everyday living.</p>
        </div>
        <Link to="/cart" className="storefront-shop-cart">
          <FiShoppingCart aria-hidden="true" />
          View cart <span>{getTotalItems()}</span>
        </Link>
      </section>

      <section className="storefront-shop-content" aria-label="Shop products">
        <div className="storefront-shop-toolbar">
          <label className="storefront-shop-search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
            />
          </label>
          <label>
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option>All categories</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name</option>
            </select>
          </label>
          <span className="storefront-shop-result-count">{filteredProducts.length} products</span>
        </div>

        {isLoadingDatabase ? (
          <div className="storefront-shop-empty" role="status">Loading products…</div>
        ) : databaseError ? (
          <div className="storefront-shop-empty storefront-shop-error" role="alert">
            <h2>Products couldn’t be loaded</h2>
            <p>{databaseError}</p>
          </div>
        ) : filteredProducts.length ? (
          <div className="storefront-products-grid">
            {filteredProducts.map((product) => (
              <article className="storefront-product-card" key={product.id}>
                <div className="storefront-product-image">
                  {product.image
                    ? <img src={product.image} alt={product.name} loading="lazy" />
                    : <FiBox aria-label="No product image" />}
                </div>
                <div className="storefront-product-details">
                  <span>{product.category || 'Araire Ventures'}</span>
                  <h2>{product.name}</h2>
                  <div className="storefront-product-bottom">
                    <strong>{formatPrice(product.price)}</strong>
                    <button type="button" onClick={() => handleAddToCart(product)}>
                      <FiPlus aria-hidden="true" /> Add to cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="storefront-shop-empty">
            <FiSearch aria-hidden="true" />
            <h2>No products found</h2>
            <p>Try another search or choose a different category.</p>
            <button type="button" onClick={() => { setSearch(''); setCategory('All categories'); }}>
              Clear filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default StorefrontShop;
