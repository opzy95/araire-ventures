import React, { useEffect, useMemo, useState } from 'react';
import { FiBox, FiEdit2, FiLogOut, FiPlus, FiSearch, FiTrash2, FiUsers, FiX } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../../contexts/ProductContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest, authEndpoints } from '../../services/api';
import './AdminDashboard.css';

const categories = ['Kitchen', 'Appliances', 'Others'];

function AdminDashboard() {
  const { databaseProducts: products, addProduct, updateProduct, removeProduct, databaseError, isLoadingDatabase } = useProducts();
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'Kitchen',
    imageFile: null,
    currentImage: '',
    rating: '5',
  });

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All categories' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }), [products, search, categoryFilter]);

  useEffect(() => {
    let isCurrent = true;
    setIsLoadingUsers(true);
    setUsersError('');
    apiRequest(authEndpoints.users, { token })
      .then((payload) => {
        const result = payload?.data ?? payload;
        const records = Array.isArray(result) ? result : result?.users ?? result?.items ?? [];
        if (isCurrent) setUsers(records);
      })
      .catch((error) => {
        if (isCurrent) setUsersError(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingUsers(false);
      });
    return () => { isCurrent = false; };
  }, [token]);

  const submitProduct = async (event) => {
    event.preventDefault();
    setActionError('');
    setIsSavingProduct(true);
    try {
      const product = {
        name: form.name.trim(),
        price: Number(form.price).toLocaleString('en-NG'),
        category: form.category,
        ...(form.imageFile ? { image: form.imageFile } : {}),
        rating: Number(form.rating),
      };
      if (editingProduct) {
        await updateProduct(editingProduct.id, product);
      } else {
        const productId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await addProduct({ id: productId, ...product });
      }
      setForm({ name: '', price: '', category: 'Kitchen', imageFile: null, currentImage: '', rating: '5' });
      setEditingProduct(null);
      setIsFormOpen(false);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const openNewProductForm = () => {
    setActionError('');
    setEditingProduct(null);
    setForm({ name: '', price: '', category: 'Kitchen', imageFile: null, currentImage: '', rating: '5' });
    setIsFormOpen(true);
  };

  const openEditProductForm = (product) => {
    if (product.source !== 'database') return;
    setActionError('');
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      price: String(product.price ?? '').replace(/[^\d.]/g, ''),
      category: product.category || 'Others',
      imageFile: null,
      currentImage: product.image || '',
      rating: String(product.rating ?? 5),
    });
    setIsFormOpen(true);
  };

  const closeProductForm = () => {
    if (isSavingProduct) return;
    setIsFormOpen(false);
    setEditingProduct(null);
    setActionError('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const deleteProduct = async (product) => {
    if (product.source !== 'database') return;
    if (window.confirm(`Delete ${product.name} from the database?`)) {
      setActionError('');
      try {
        await removeProduct(product);
      } catch (error) {
        setActionError(error.message);
      }
    }
  };

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-heading">
          <span className="admin-mark">AV</span>
          <div>
            <strong>Araire</strong>
            <span>Store management</span>
          </div>
        </div>
        <p className="admin-nav-label">WORKSPACE</p>
        <button
          className={`admin-side-link ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <FiBox /> Products <span>{products.length}</span>
        </button>
        <button
          className={`admin-side-link ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FiUsers /> Users <span>{users.length}</span>
        </button>
        <div className="admin-sidebar-note">This inventory shows products stored in the database.</div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <span>ARAIRE VENTURES / ADMIN</span>
          <div className="admin-topbar-actions">
            <span>{user?.name || user?.email}</span>
            <Link to="/">View storefront <span aria-hidden="true">↗</span></Link>
            <button className="admin-logout-btn" onClick={handleLogout} title="Sign out"><FiLogOut /><span>Log out</span></button>
          </div>
        </header>

        {activeTab === 'products' ? (
          <div className="admin-content">
            <div className="admin-page-title">
              <div>
                <p className="admin-eyebrow">CATALOG</p>
                <h1>Products</h1>
                <p className="admin-subtitle">Manage the items shown in your storefront.</p>
              </div>
              <button className="admin-primary-btn" onClick={openNewProductForm}>
                <FiPlus /> Add product
              </button>
            </div>

            {(databaseError || actionError) && <div className="admin-api-alert" role="alert">{actionError || `Database connection: ${databaseError}`}</div>}

            <div className="admin-stats-row">
              <div className="admin-stat">
                <span>Database products</span>
                <strong>{products.length}</strong>
              </div>
              <div className="admin-stat">
                <span>Categories</span>
                <strong>{new Set(products.map((product) => product.category)).size}</strong>
              </div>
              <div className="admin-stat">
                <span>Registered users</span>
                <strong>{users.length}</strong>
              </div>
            </div>

            <div className="admin-list-toolbar">
              <label className="admin-search">
                <FiSearch />
                <input
                  type="search"
                  placeholder="Search products"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option>All categories</option>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>RATING</th><th aria-label="Actions" /></tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={`${product.category}-${product.id}`}>
                      <td>
                        <div className="admin-product-cell">
                          <img src={product.image} alt="" />
                          <strong>{product.name}</strong>
                        </div>
                      </td>
                      <td><span className="admin-category-tag">{product.category}</span></td>
                      <td>₦{product.price}</td>
                      <td>{product.rating} <span className="admin-star">★</span></td>
                      <td>
                        <div className="admin-product-actions">
                          <button className="admin-edit-btn" aria-label={`Edit ${product.name}`} title="Edit product" onClick={() => openEditProductForm(product)}>
                            <FiEdit2 />
                          </button>
                          <button className="admin-delete-btn" aria-label={`Delete ${product.name}`} title="Delete product" onClick={() => deleteProduct(product)}>
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoadingDatabase && filteredProducts.length === 0 && (
                    <tr><td colSpan="5" className="admin-empty-row">No products match this search.</td></tr>
                  )}
                  {isLoadingDatabase && filteredProducts.length === 0 && (
                    <tr><td colSpan="5" className="admin-empty-row">Loading database products…</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="admin-content">
            <div className="admin-page-title">
              <div>
                <p className="admin-eyebrow">CUSTOMERS</p>
                <h1>Users</h1>
                <p className="admin-subtitle">Registered customer accounts for your store.</p>
              </div>
            </div>
            <div className="admin-users-panel">
              {isLoadingUsers ? (
                <div className="admin-users-empty"><p>Loading users…</p></div>
              ) : usersError ? (
                <div className="admin-users-empty"><h2>Could not load users</h2><p>{usersError}</p></div>
              ) : users.length ? (
                <table className="admin-table">
                  <thead><tr><th>NAME</th><th>EMAIL</th><th>JOINED</th></tr></thead>
                  <tbody>{users.map((user, index) => (
                    <tr key={user.id || user.email || index}>
                      <td>{user.name || user.fullName || 'Customer'}</td>
                      <td>{user.email || '—'}</td>
                      <td>{user.createdAt || user.registeredAt || '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : (
                <div className="admin-users-empty">
                  <span className="admin-empty-icon"><FiUsers /></span>
                  <h2>No registered users yet</h2>
                  <p>User accounts will appear here once registration is connected to the store.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {isFormOpen && (
        <div className="admin-modal-backdrop" onClick={closeProductForm}>
          <section className="admin-product-modal" role="dialog" aria-modal="true" aria-labelledby="add-product-title" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-heading">
              <div><p className="admin-eyebrow">{editingProduct ? 'UPDATE INVENTORY' : 'NEW INVENTORY'}</p><h2 id="add-product-title">{editingProduct ? 'Edit product' : 'Add product'}</h2></div>
              <button className="admin-close-btn" aria-label="Close" onClick={closeProductForm} disabled={isSavingProduct}><FiX /></button>
            </div>
            {actionError && <div className="admin-form-error" role="alert">{actionError}</div>}
            <form onSubmit={submitProduct} className="admin-product-form">
              <label>Product name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <div className="admin-form-row">
                <label>Price (NGN)<input required type="number" min="1" step="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
                <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
              </div>
              <label>Product image<input type="file" accept="image/*" required={!editingProduct} onChange={(event) => setForm({ ...form, imageFile: event.target.files?.[0] || null })} /></label>
              {form.imageFile && <p className="admin-selected-image">Selected: {form.imageFile.name}</p>}
              {!form.imageFile && form.currentImage && <div className="admin-current-image"><img src={form.currentImage} alt="Current product" /><span>Current image will be kept unless you choose another.</span></div>}
              <label>Rating<input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })} /></label>
              <div className="admin-form-actions">
                <button type="button" className="admin-cancel-btn" onClick={closeProductForm} disabled={isSavingProduct}>Cancel</button>
                <button type="submit" className="admin-primary-btn" disabled={isSavingProduct}>{!editingProduct && <FiPlus />} {isSavingProduct ? 'Publishing…' : editingProduct ? 'Save changes' : 'Publish'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default AdminDashboard;