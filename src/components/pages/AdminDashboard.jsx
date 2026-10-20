import React, { useEffect, useMemo, useState } from 'react';
import { FiBox, FiEdit2, FiLogOut, FiPlus, FiSearch, FiShoppingBag, FiTrash2, FiUsers, FiX } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../../contexts/ProductContext';
import { isAdminUser, useAuth } from '../../contexts/AuthContext';
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
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const [orderActionError, setOrderActionError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
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
        const result = payload?.data?.data ?? payload?.data ?? payload;
        const records = Array.isArray(result) ? result : result?.users ?? result?.items ?? [];
        if (isCurrent) setUsers(records.filter((record) => !isAdminUser(record)));
      })
      .catch((error) => {
        if (isCurrent) setUsersError(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingUsers(false);
      });
    return () => { isCurrent = false; };
  }, [token]);

  useEffect(() => {
    if (activeTab !== 'orders') return undefined;
    let isCurrent = true;
    setIsLoadingOrders(true);
    setOrdersError('');
    apiRequest(authEndpoints.orders, { token })
      .then((payload) => {
        const result = payload?.data?.data ?? payload?.data ?? payload;
        const records = Array.isArray(result)
          ? result
          : result?.orders ?? result?.items ?? result?.results ?? [];
        if (isCurrent) setOrders(records);
      })
      .catch((error) => {
        if (isCurrent) setOrdersError(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingOrders(false);
      });
    return () => { isCurrent = false; };
  }, [activeTab, ordersRefreshKey, token]);

  const verifyOrderPayment = async (order) => {
    const orderId = order.id ?? order._id;
    if (!orderId || String(order.paymentStatus || '').toLowerCase() === 'paid') return;
    if (!window.confirm(`Confirm that payment for order ${String(orderId).slice(-8)} has been received?`)) return;

    setOrderActionError('');
    setUpdatingOrderId(orderId);
    try {
      await apiRequest(`${authEndpoints.orders}/${encodeURIComponent(orderId)}/payment`, {
        method: 'PATCH',
        token,
      });
      setOrders((currentOrders) => currentOrders.map((item) => (
        (item.id ?? item._id) === orderId
          ? { ...item, paymentStatus: 'paid' }
          : item
      )));
    } catch (error) {
      setOrderActionError(error.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatRegistrationDate = (customer) => {
    const registrationDate = customer.createdAt
      ?? customer.registeredAt
      ?? customer.created_at
      ?? customer.dateJoined
      ?? customer.joinedAt
      ?? customer.registrationDate
      ?? customer.createdOn;

    let date;
    if (registrationDate) {
      date = new Date(registrationDate);
    } else {
      const id = customer.id ?? customer._id;
      if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) return '—';
      date = new Date(Number.parseInt(id.slice(0, 8), 16) * 1000);
    }
    return Number.isNaN(date.getTime())
      ? '—'
      : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  };

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
        <button
          className={`admin-side-link ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => {
            setOrdersError('');
            setIsLoadingOrders(true);
            setOrdersRefreshKey((current) => current + 1);
            setActiveTab('orders');
          }}
        >
          <FiShoppingBag /> Orders <span>{orders.length}</span>
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
        ) : activeTab === 'users' ? (
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
                  <tbody>{users.map((customer, index) => (
                    <tr key={customer.id || customer._id || customer.email || index}>
                      <td>{customer.name || customer.fullName || 'Customer'}</td>
                      <td>{customer.email || '—'}</td>
                      <td>{formatRegistrationDate(customer)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : (
                <div className="admin-users-empty">
                  <span className="admin-empty-icon"><FiUsers /></span>
                  <h2>No customer accounts yet</h2>
                  <p>Customer accounts will appear here after registration.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="admin-content">
            <div className="admin-page-title">
              <div>
                <p className="admin-eyebrow">FULFILMENT</p>
                <h1>Orders</h1>
                <p className="admin-subtitle">Review customer orders and verify payment before updating their status.</p>
              </div>
            </div>
            {orderActionError && <div className="admin-api-alert" role="alert">{orderActionError}</div>}
            {ordersError ? (
              <div className="admin-api-alert" role="alert">
                <p>{ordersError}</p>
                <button
                  className="admin-retry-button"
                  type="button"
                  onClick={() => {
                    setOrdersError('');
                    setIsLoadingOrders(true);
                    setOrdersRefreshKey((current) => current + 1);
                  }}
                >
                  Retry loading orders
                </button>
              </div>
            ) : isLoadingOrders ? (
              <div className="admin-users-empty"><p>Loading orders…</p></div>
            ) : orders.length ? (
              <div className="admin-orders-grid">
                {orders.map((order, index) => {
                  const orderId = order.id ?? order._id ?? index;
                  const lineItems = order.items ?? order.products ?? [];
                  const status = String(order.status || 'pending').toLowerCase();
                  const paymentStatus = String(order.paymentStatus || 'pending').toLowerCase();
                  const customer = order.user ?? order.customer ?? (typeof order.userId === 'object' ? order.userId : null);
                  const customerName = order.customerName
                    || order.userName
                    || customer?.name
                    || customer?.fullName
                    || customer?.username
                    || 'Customer';
                  const receiptUrl = order.receiptUrl
                    || order.paymentReceiptUrl
                    || (typeof order.receipt === 'string'
                      ? order.receipt
                      : order.receipt?.url ?? order.receipt?.imageUrl ?? order.receipt?.secure_url)
                    || order.payment?.receiptUrl
                    || order.payment?.receipt?.url
                    || order.payment?.receipt?.imageUrl;
                  return (
                    <article className="admin-order-card" key={orderId}>
                      <header>
                        <div>
                          <span className="admin-order-reference">ORDER {String(orderId).slice(-8)}</span>
                          <p>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date unavailable'}</p>
                        </div>
                        <div className="admin-order-statuses">
                          <span className={`admin-order-status status-${status}`}>Order: {status}</span>
                          <span className={`admin-order-status payment-${paymentStatus}`}>Payment: {paymentStatus}</span>
                        </div>
                      </header>
                      <div className="admin-order-customer">
                        <strong>{customerName}</strong>
                        {customer?.email && <span>{customer.email}</span>}
                        <span>{order.phoneNumber || customer?.phoneNumber || customer?.phone || 'No phone number'}</span>
                        <span>{order.deliveryAddress || 'No delivery address'}</span>
                      </div>
                      {lineItems.length > 0 && (
                        <ul className="admin-order-items">
                          {lineItems.map((line, lineIndex) => {
                            const product = line.product ?? line;
                            const lineId = product.id ?? product._id ?? line.productId ?? lineIndex;
                            const quantity = Number(line.quantity) || 1;
                            const price = Number(String(product.price ?? line.price ?? '').replace(/[^\d.-]/g, '')) || 0;
                            const imageUrl = product.image ?? product.imageUrl ?? product.productImage ?? line.image ?? line.imageUrl;
                            return (
                              <li key={lineId}>
                                <span className="admin-order-item-product">
                                  <span className="admin-order-item-thumbnail">
                                    {imageUrl
                                      ? <img src={imageUrl} alt="" loading="lazy" />
                                      : <FiBox aria-hidden="true" />}
                                  </span>
                                  <span className="admin-order-item-description">
                                    {product.name || line.name || 'Product'} × {quantity}
                                  </span>
                                </span>
                                <strong>₦{(price * quantity).toLocaleString('en-NG')}</strong>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {receiptUrl && (
                        <a
                          className="admin-order-receipt"
                          href={receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Open payment receipt image in a new tab"
                        >
                          <img src={receiptUrl} alt="Customer payment receipt" loading="lazy" />
                          <span>View payment receipt</span>
                        </a>
                      )}
                      <footer>
                        <span>Total</span>
                        <strong>₦{(Number(String(order.total ?? order.subtotal ?? '').replace(/[^\d.-]/g, '')) || 0).toLocaleString('en-NG')}</strong>
                      </footer>
                      {order.id || order._id ? paymentStatus !== 'paid' && (
                        <button
                          className="admin-verify-payment"
                          type="button"
                          disabled={updatingOrderId === orderId}
                          onClick={() => verifyOrderPayment(order)}
                        >
                          {updatingOrderId === orderId ? 'Updating payment…' : 'Confirm payment received'}
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="admin-users-empty">
                <span className="admin-empty-icon"><FiShoppingBag /></span>
                <h2>No orders yet</h2>
                <p>Customer orders will appear here when they are placed.</p>
              </div>
            )}
            <p className="admin-orders-note">
              Orders are created as pending. This backend does not yet provide an admin status-update endpoint, so this dashboard cannot mark an order as paid.
            </p>
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