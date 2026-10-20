import React, { useEffect, useMemo, useState } from 'react';
import {
  FiArrowUpRight,
  FiBox,
  FiGrid,
  FiHome,
  FiLogOut,
  FiMinus,
  FiPackage,
  FiPlus,
  FiSearch,
  FiShoppingBag,
  FiShoppingCart,
  FiTrash2,
  FiUser,
} from 'react-icons/fi';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { isAdminUser, useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../contexts/ProductContext';
import { useToast } from '../../contexts/ToastContext';
import { apiRequest, authEndpoints } from '../../services/api';
import OrderCheckout from '../OrderCheckout';
import './CustomerDashboard.css';

const sections = [
  { id: 'overview', label: 'Overview', icon: FiHome },
  { id: 'shop', label: 'Shop', icon: FiShoppingBag },
  { id: 'cart', label: 'My cart', icon: FiShoppingCart },
  { id: 'orders', label: 'Orders', icon: FiPackage },
  { id: 'account', label: 'Account', icon: FiUser },
];

function formatPrice(price) {
  const amount = Number(String(price ?? '').replace(/[^\d.-]/g, ''));
  return `₦${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-NG')}`;
}

function CustomerDashboard() {
  const { user, token, logout } = useAuth();
  const { products, databaseError, isLoadingDatabase } = useProducts();
  const {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotalItems,
    getTotalPrice,
    loading: isCartLoading,
    error: cartError,
    loadError: cartLoadError,
  } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [sort, setSort] = useState('featured');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);

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

  useEffect(() => {
    if (activeSection !== 'orders' || !token) return undefined;
    let isCurrent = true;

    apiRequest(authEndpoints.myOrders, { token })
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
  }, [activeSection, ordersRefreshKey, token]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const openSection = (section) => {
    if (section === 'orders') {
      setIsLoadingOrders(true);
      setOrdersError('');
      setOrdersRefreshKey((current) => current + 1);
    }
    setActiveSection(section);
  };
  const addProductToCart = async (product) => {
    try {
      await addToCart(product);
      addToast(`${product.name} added to your cart.`, 'success');
    } catch (error) {
      addToast(`Could not add ${product.name}: ${error.message}`, 'error');
    }
  };

  const handleCartAction = async (action) => {
    try {
      await action;
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  const cartTotal = getTotalPrice();

  const renderShop = () => (
    <>
      <div className="customer-page-heading">
        <div>
          <p className="customer-dashboard-eyebrow">THE ARAIRE COLLECTION</p>
          <h1>Shop all products</h1>
          <p>Find something useful and lovely for your home.</p>
        </div>
        <span className="customer-result-count">{filteredProducts.length} products</span>
      </div>

      <div className="customer-shop-filters">
        <label className="customer-search">
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
      </div>

      {isLoadingDatabase ? (
        <div className="customer-empty-state">Loading products…</div>
      ) : databaseError ? (
        <div className="customer-empty-state customer-error-state">
          <h2>Products couldn’t be loaded</h2>
          <p>{databaseError}</p>
        </div>
      ) : filteredProducts.length ? (
        <div className="customer-products-grid">
          {filteredProducts.map((product) => (
            <article className="customer-product-card" key={product.id}>
              <div className="customer-product-image">
                {product.image
                  ? <img src={product.image} alt={product.name} loading="lazy" />
                  : <FiBox aria-label="No product image" />}
              </div>
              <div className="customer-product-details">
                <span>{product.category || 'Araire Ventures'}</span>
                <h2>{product.name}</h2>
                <div className="customer-product-bottom">
                  <strong>{formatPrice(product.price)}</strong>
                  <button type="button" onClick={() => addProductToCart(product)}>
                    <FiPlus /> Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="customer-empty-state">
          <FiSearch />
          <h2>No products found</h2>
          <p>Try another search or choose a different category.</p>
          <button type="button" onClick={() => { setSearch(''); setCategory('All categories'); }}>
            Clear filters
          </button>
        </div>
      )}
    </>
  );

  const renderCart = () => (
    <>
      <div className="customer-page-heading">
        <div>
          <p className="customer-dashboard-eyebrow">READY WHEN YOU ARE</p>
          <h1>My cart</h1>
          <p>{getTotalItems()} item{getTotalItems() === 1 ? '' : 's'} in your cart.</p>
        </div>
      </div>
      {(cartError || cartLoadError) && items.length > 0 && (
        <p className="customer-cart-error" role="alert">{cartError || cartLoadError}</p>
      )}
      {isCartLoading ? (
        <div className="customer-empty-state" role="status">Loading your cart…</div>
      ) : items.length ? (
        <div className="customer-cart-layout">
          <div className="customer-cart-items">
            {items.map((item) => (
              <article className="customer-cart-item" key={item.id}>
                <div className="customer-cart-image">
                  {item.image && <img src={item.image} alt={item.name} />}
                </div>
                <div className="customer-cart-description">
                  <h2>{item.name}</h2>
                  <p>{formatPrice(item.price)} each</p>
                </div>
                <div className="customer-quantity-control" aria-label={`Quantity for ${item.name}`}>
                  <button type="button" aria-label="Decrease quantity" onClick={() => handleCartAction(updateQuantity(item.id, item.quantity - 1))}><FiMinus /></button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label="Increase quantity" onClick={() => handleCartAction(updateQuantity(item.id, item.quantity + 1))}><FiPlus /></button>
                </div>
                <button
                  className="customer-remove-item"
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => handleCartAction(removeFromCart(item.id))}
                >
                  <FiTrash2 />
                </button>
              </article>
            ))}
          </div>
          <aside className="customer-order-summary">
            <h2>Order summary</h2>
            <ul className="customer-summary-items">
              {items.map((item) => (
                <li key={item.id}>
                  <span>{item.name} <small>× {item.quantity}</small></span>
                  <strong>{formatPrice(Number(String(item.price ?? '').replace(/[^\d.-]/g, '')) * item.quantity)}</strong>
                </li>
              ))}
            </ul>
            <p className="customer-summary-total">
              <span>Total amount of goods</span>
              <strong>{formatPrice(cartTotal)}</strong>
            </p>
            <p className="customer-summary-note">Delivery details can be confirmed when you place your order.</p>
            <button type="button" onClick={() => setIsCheckoutOpen(true)}>Continue to checkout <FiArrowUpRight /></button>
            <button className="customer-text-button" type="button" onClick={() => openSection('shop')}>Continue shopping</button>
          </aside>
        </div>
      ) : cartLoadError ? (
        <div className="customer-empty-state customer-error-state" role="alert">
          <h2>Could not load your cart</h2>
          <p>{cartLoadError}</p>
        </div>
      ) : cartError ? (
        <div className="customer-empty-state customer-error-state" role="alert">
          <h2>Could not complete cart action</h2>
          <p>{cartError}</p>
        </div>
      ) : (
        <div className="customer-empty-state">
          <FiShoppingCart />
          <h2>Your cart is empty</h2>
          <p>Browse the shop and add something you love.</p>
          <button type="button" onClick={() => openSection('shop')}>Explore the shop <FiArrowUpRight /></button>
        </div>
      )}
    </>
  );

  const renderOverview = () => (
    <>
      <div className="customer-welcome-panel">
        <p className="customer-dashboard-eyebrow">CUSTOMER DASHBOARD</p>
        <h1>Welcome{user?.name ? `, ${user.name}` : ' back'}.</h1>
        <p>Shop home essentials, keep track of your cart, and manage your account.</p>
        <button type="button" onClick={() => openSection('shop')}>Explore the shop <FiArrowUpRight /></button>
      </div>
      <div className="customer-overview-cards">
        <button type="button" onClick={() => openSection('shop')}>
          <span className="customer-overview-icon"><FiGrid /></span>
          <span><strong>Shop all products</strong><small>Browse and filter the collection</small></span>
          <FiArrowUpRight />
        </button>
        <button type="button" onClick={() => openSection('cart')}>
          <span className="customer-overview-icon"><FiShoppingCart /></span>
          <span><strong>My cart</strong><small>{getTotalItems()} item{getTotalItems() === 1 ? '' : 's'} waiting</small></span>
          <FiArrowUpRight />
        </button>
        <button type="button" onClick={() => openSection('orders')}>
          <span className="customer-overview-icon"><FiPackage /></span>
          <span><strong>Orders</strong><small>Order information and updates</small></span>
          <FiArrowUpRight />
        </button>
      </div>
      <section className="customer-account-card">
        <span className="customer-overview-icon"><FiUser /></span>
        <div>
          <p className="customer-account-label">YOUR ACCOUNT</p>
          <h2>{user?.name || user?.fullName || 'Customer'}</h2>
          <p>{user?.email || 'No email address provided'}</p>
        </div>
        <button type="button" onClick={() => openSection('account')}>Manage account <FiArrowUpRight /></button>
      </section>
    </>
  );

  const renderOrders = () => (
    <>
      <div className="customer-page-heading">
        <div>
          <p className="customer-dashboard-eyebrow">YOUR PURCHASES</p>
          <h1>Orders</h1>
          <p>Review your orders and payment confirmation status.</p>
        </div>
      </div>
      {isLoadingOrders ? (
        <div className="customer-empty-state" role="status">Loading your orders…</div>
      ) : ordersError ? (
        <div className="customer-empty-state customer-error-state" role="alert">
          <h2>Could not load your orders</h2>
          <p>{ordersError}</p>
          <button
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
      ) : orders.length ? (
        <div className="customer-orders-list">
          {orders.map((order, index) => {
            const orderId = order.id ?? order._id ?? `order-${index}`;
            const lineItems = order.items ?? [];
            const paymentStatus = String(order.paymentStatus || 'pending').toLowerCase();
            const orderStatus = String(order.status || 'pending').toLowerCase();
            return (
              <article className="customer-order-card" key={orderId}>
                <header>
                  <div>
                    <span className="customer-order-reference">ORDER {String(orderId).slice(-8)}</span>
                    <p>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date unavailable'}</p>
                  </div>
                  <div className="customer-order-statuses">
                    <span className={`customer-order-status order-${orderStatus}`}>Order: {orderStatus}</span>
                    <span className={`customer-order-status payment-${paymentStatus}`}>Payment: {paymentStatus}</span>
                  </div>
                </header>
                {lineItems.length > 0 && (
                  <ul className="customer-order-items">
                    {lineItems.map((line, lineIndex) => {
                      const product = line.product ?? line;
                      const itemId = product.id ?? product._id ?? line.productId ?? lineIndex;
                      const quantity = Number(line.quantity) || 1;
                      const price = Number(String(product.price ?? line.price ?? '').replace(/[^\d.-]/g, '')) || 0;
                      const imageUrl = product.image ?? product.imageUrl ?? product.productImage ?? line.image ?? line.imageUrl;
                      return (
                        <li key={itemId}>
                          <span className="customer-order-item-product">
                            <span className="customer-order-item-thumbnail">
                              {imageUrl
                                ? <img src={imageUrl} alt="" loading="lazy" />
                                : <FiBox aria-hidden="true" />}
                            </span>
                            <span className="customer-order-item-description">
                              {product.name || line.name || 'Product'} <small>× {quantity}</small>
                            </span>
                          </span>
                          <strong>{formatPrice(price * quantity)}</strong>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <footer>
                  <span>Total</span>
                  <strong>{formatPrice(order.total ?? order.subtotal)}</strong>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="customer-empty-state">
          <FiPackage />
          <h2>No orders yet</h2>
          <p>Once you place an order, its items and payment status will appear here.</p>
          <button type="button" onClick={() => openSection('shop')}>Start shopping <FiArrowUpRight /></button>
        </div>
      )}
    </>
  );

  const renderAccount = () => (
    <>
      <div className="customer-page-heading">
        <div>
          <p className="customer-dashboard-eyebrow">PERSONAL INFORMATION</p>
          <h1>Account</h1>
          <p>Your account details used for this session.</p>
        </div>
      </div>
      <section className="customer-account-card customer-account-page-card">
        <span className="customer-account-icon"><FiUser /></span>
        <div>
          <p className="customer-account-label">ACCOUNT DETAILS</p>
          <h2>{user?.name || user?.fullName || 'Customer'}</h2>
          <p>{user?.email || 'No email address provided'}</p>
          {user?.role && <span className="customer-role-label">{user.role}</span>}
        </div>
      </section>
    </>
  );

  const content = {
    overview: renderOverview,
    shop: renderShop,
    cart: renderCart,
    orders: renderOrders,
    account: renderAccount,
  }[activeSection]();

  return (
    <>
    <main className="customer-dashboard">
      <aside className="customer-sidebar">
        <div className="customer-sidebar-brand">
          <span className="customer-brand-mark">AV</span>
          <span><strong>Araire</strong><small>VENTURES</small></span>
        </div>
        <p className="customer-sidebar-label">MENU</p>
        <nav aria-label="Customer dashboard">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              className={`customer-sidebar-link${activeSection === id ? ' active' : ''}`}
              key={id}
              type="button"
              onClick={() => openSection(id)}
              aria-current={activeSection === id ? 'page' : undefined}
            >
              <Icon />
              <span>{label}</span>
              {id === 'cart' && getTotalItems() > 0 && <small>{getTotalItems()}</small>}
            </button>
          ))}
        </nav>
        <div className="customer-sidebar-bottom">
          <button type="button" onClick={() => navigate('/')}><FiArrowUpRight /> Visit storefront</button>
          <button type="button" onClick={handleLogout}><FiLogOut /> Log out</button>
        </div>
      </aside>
      <section className="customer-dashboard-main">
        <header className="customer-dashboard-topbar">
          <div className="customer-mobile-brand">Araire Ventures</div>
          <span>Welcome back{user?.name ? `, ${user.name}` : ''}</span>
          <button type="button" onClick={() => openSection('cart')} aria-label={`Open cart with ${getTotalItems()} items`}>
            <FiShoppingCart /> <span>Cart</span>
            {getTotalItems() > 0 && <small>{getTotalItems()}</small>}
          </button>
        </header>
        <div className="customer-dashboard-content">{content}</div>
      </section>
    </main>
    {isCheckoutOpen && <OrderCheckout onClose={() => setIsCheckoutOpen(false)} />}
    </>
  );
}

export function ProtectedCustomerRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (isAdminUser(user)) return <Navigate to="/admin" replace />;
  return user
    ? children
    : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export default CustomerDashboard;
