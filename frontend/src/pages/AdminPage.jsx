import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Toast from '../components/Toast';
import './AdminPage.css';

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('grocery_admin_token'));
  
  // Admin Login State
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard Data State
  const [activeTab, setActiveTab] = useState('inventory'); // 'users', 'orders', 'inventory', 'credentials'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ stats: {}, users: [], orders: [], products: [], feedbacks: [] });
  const [searchTerm, setSearchTerm] = useState('');

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);

  // Edit Stock State
  const [editingProduct, setEditingProduct] = useState(null); // { id, stock, status, price }
  const [savingStock, setSavingStock] = useState(false);

  // Change Admin Credentials State
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [savingCredentials, setSavingCredentials] = useState(false);

  // Add Product State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'vegetables',
    price: '',
    old_price: '',
    unit: '1 kg',
    emoji: '🥦',
    stock: 50,
    status: 'available',
    description: ''
  });

  const [toast, setToast] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
      if (err.message.includes('Admin authentication') || err.message.includes('expired')) {
        handleAdminLogout();
      } else {
        setError(err.message || 'Failed to load admin data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      setToast({ type: 'error', message: 'Product name and price are required' });
      return;
    }
    try {
      setAddingProduct(true);
      const res = await api.adminAddProduct(newProduct);
      setToast({ type: 'success', message: `Product "${res.product.name}" added successfully!` });
      setIsAddProductOpen(false);
      setNewProduct({
        name: '',
        category: 'vegetables',
        price: '',
        old_price: '',
        unit: '1 kg',
        emoji: '🥦',
        stock: 50,
        status: 'available',
        description: ''
      });
      await fetchDashboardData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to add product.' });
    } finally {
      setAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the store catalog?`)) return;
    try {
      await api.adminDeleteProduct(id);
      setToast({ type: 'success', message: `Product "${name}" deleted.` });
      await fetchDashboardData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete product.' });
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.adminUpdateOrderStatus(orderId, newStatus);
      setToast({ type: 'success', message: `Order #${orderId} marked as ${newStatus}.` });
      await fetchDashboardData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update order status.' });
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchDashboardData();
    }
  }, [adminToken]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      setLoginLoading(true);
      setLoginError('');
      const res = await api.adminLogin({
        username: adminUsername,
        password: adminPassword
      });
      localStorage.setItem('grocery_admin_token', res.token);
      setAdminToken(res.token);
      setToast({ type: 'success', message: 'Admin authentication successful!' });
    } catch (err) {
      setLoginError(err.message || 'Invalid admin credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('grocery_admin_token');
    setAdminToken(null);
    setData({ stats: {}, users: [], orders: [], products: [] });
  };

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    try {
      setLoadingOrderItems(true);
      const res = await api.getAdminOrderDetails(order.id);
      setOrderItems(res.items || []);
    } catch (err) {
      console.error(err);
      setOrderItems([]);
    } finally {
      setLoadingOrderItems(false);
    }
  };

  const handleStartEditStock = (prod) => {
    setEditingProduct({
      id: prod.id,
      name: prod.name,
      stock: prod.stock,
      status: prod.status || (prod.stock === 0 ? 'sold_out' : 'available'),
      price: prod.price
    });
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setSavingStock(true);
      const res = await api.updateProductStock(editingProduct.id, {
        stock: parseInt(editingProduct.stock),
        status: editingProduct.status,
        price: parseFloat(editingProduct.price)
      });
      setToast({ type: 'success', message: `Updated ${res.product.name} stock & status!` });
      setEditingProduct(null);
      await fetchDashboardData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update stock.' });
    } finally {
      setSavingStock(false);
    }
  };

  const handleSaveAdminCredentials = async (e) => {
    e.preventDefault();
    if (!newAdminUsername.trim()) {
      setToast({ type: 'error', message: 'Username cannot be blank.' });
      return;
    }
    if (newAdminPassword && newAdminPassword.length < 6) {
      setToast({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      setSavingCredentials(true);
      await api.updateAdminSettings({
        username: newAdminUsername,
        email: newAdminEmail,
        password: newAdminPassword
      });
      setToast({ type: 'success', message: 'Admin credentials updated successfully!' });
      setNewAdminPassword('');
      setActiveTab('inventory');
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update credentials.' });
    } finally {
      setSavingCredentials(false);
    }
  };

  // Login Gate Screen
  if (!adminToken) {
    return (
      <div className="admin-page page-container">
        <div className="container">
          <div className="admin-login-wrapper animate-fade-in-up">
            <div className="admin-login-card glass-card">
              <div className="admin-login-icon">🔒</div>
              <h1 className="admin-login-title">Admin Control Portal</h1>
              <p className="admin-login-desc">Enter administrator credentials to manage inventory, users, and orders.</p>

              {loginError && <div className="admin-login-error">⚠️ {loginError}</div>}

              <form onSubmit={handleAdminLogin} className="admin-login-form">
                <div className="input-group">
                  <label htmlFor="adm-username">Admin Username or Email</label>
                  <input
                    type="text"
                    id="adm-username"
                    className="input-field"
                    placeholder="e.g. admin"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="adm-password">Password</label>
                  <input
                    type="password"
                    id="adm-password"
                    className="input-field"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg admin-submit-btn"
                  disabled={loginLoading}
                >
                  {loginLoading ? '⟳ Authenticating...' : 'Unlock Admin Dashboard'}
                </button>
              </form>
            </div>
          </div>
        </div>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // Filtered lists
  const filteredUsers = (data.users || []).filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      String(u.id).includes(term)
    );
  });

  const filteredOrders = (data.orders || []).filter((o) => {
    const term = searchTerm.toLowerCase();
    return (
      String(o.id).includes(term) ||
      o.user_name?.toLowerCase().includes(term) ||
      o.user_email?.toLowerCase().includes(term) ||
      o.status?.toLowerCase().includes(term)
    );
  });

  const filteredProducts = (data.products || []).filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term) ||
      p.status?.toLowerCase().includes(term)
    );
  });

  const filteredFeedbacks = (data.feedbacks || []).filter((fb) => {
    const term = searchTerm.toLowerCase();
    return (
      fb.name?.toLowerCase().includes(term) ||
      fb.email?.toLowerCase().includes(term) ||
      fb.category?.toLowerCase().includes(term) ||
      fb.message?.toLowerCase().includes(term)
    );
  });

  const { stats } = data;

  return (
    <div className="admin-page">
      <div className="container">
        {/* Admin Header */}
        <div className="admin-header">
          <div>
            <div className="admin-badge">Admin Control Center</div>
            <h1 className="admin-title">Store Management & Inventory</h1>
            <p className="admin-subtitle">
              Manage live inventory stock (Available / Sold Out / Coming Soon), customer accounts, and orders in Indian Rupees (₹).
            </p>
          </div>

          <div className="admin-top-actions">
            <button
              className="btn btn-secondary refresh-btn"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              🔄 Refresh
            </button>
            <button
              className="btn btn-secondary credentials-btn"
              onClick={() => {
                setActiveTab('credentials');
                setNewAdminUsername('admin');
                setNewAdminEmail('admin@freshmart.in');
              }}
            >
              🔑 Credentials
            </button>
            <button
              className="btn btn-danger-outline logout-admin-btn"
              onClick={handleAdminLogout}
            >
              🚪 Exit Admin
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper revenue-icon-bg">₹</div>
            <div className="stat-info">
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">₹{(stats.totalRevenue || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper user-icon-bg">👥</div>
            <div className="stat-info">
              <span className="stat-label">Registered Customers</span>
              <span className="stat-value">{stats.totalUsers || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper order-icon-bg">📦</div>
            <div className="stat-info">
              <span className="stat-label">Total Orders</span>
              <span className="stat-value">{stats.totalOrders || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper product-icon-bg">🥑</div>
            <div className="stat-info">
              <span className="stat-label">Products ({stats.totalProducts || 0})</span>
              <span className="stat-sub-info">
                <span className="text-red">{stats.soldOutProducts || 0} Sold Out</span> •{' '}
                <span className="text-purple">{stats.comingSoonProducts || 0} Soon</span>
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper feedback-icon-bg">💬</div>
            <div className="stat-info">
              <span className="stat-label">Feedbacks</span>
              <span className="stat-value">{stats.totalFeedbacks || data.feedbacks?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Search */}
        <div className="admin-toolbar">
          <div className="admin-tabs">
            <button
              className={`admin-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => { setActiveTab('inventory'); setSearchTerm(''); }}
            >
              🥦 Inventory & Stock ({data.products?.length || 0})
            </button>
            <button
              className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => { setActiveTab('users'); setSearchTerm(''); }}
            >
              👥 Customers ({data.users?.length || 0})
            </button>
            <button
              className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => { setActiveTab('orders'); setSearchTerm(''); }}
            >
              📦 Orders ({data.orders?.length || 0})
            </button>
            <button
              className={`admin-tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => { setActiveTab('feedback'); setSearchTerm(''); }}
            >
              💬 Feedback ({data.feedbacks?.length || 0})
            </button>
            <button
              className={`admin-tab-btn ${activeTab === 'credentials' ? 'active' : ''}`}
              onClick={() => setActiveTab('credentials')}
            >
              ⚙️ Admin Credentials
            </button>
          </div>

          {activeTab !== 'credentials' && (
            <div className="admin-search-wrapper">
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-search-input"
              />
              {searchTerm && (
                <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab: Inventory & Stock Management */}
        {activeTab === 'inventory' && (
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Product Inventory ({filteredProducts.length} items)</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Live catalog: Add products, update stock/pricing, or remove items.</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setIsAddProductOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                id="admin-add-product-btn"
              >
                <span>➕</span> Add New Product
              </button>
            </div>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price (₹)</th>
                    <th>Unit</th>
                    <th>Stock Count</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isSoldOut = p.status === 'sold_out' || p.stock === 0;
                    const isComingSoon = p.status === 'coming_soon';

                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="product-cell">
                            <span className="product-table-emoji">{p.emoji}</span>
                            <div>
                              <strong>{p.name}</strong>
                              <p className="product-subtext">{p.description}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="category-pill">{p.category}</span>
                        </td>
                        <td className="font-semibold text-accent">
                          ₹{Number(p.price).toFixed(2)}
                        </td>
                        <td className="text-muted">{p.unit}</td>
                        <td>
                          <span className={`stock-number ${p.stock < 20 && !isSoldOut ? 'stock-low' : ''}`}>
                            {p.stock} units
                          </span>
                        </td>
                        <td>
                          {isSoldOut ? (
                            <span className="status-pill status-cancelled">Sold Out</span>
                          ) : isComingSoon ? (
                            <span className="status-pill status-shipped">Coming Soon</span>
                          ) : (
                            <span className="status-pill status-delivered">Available</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleStartEditStock(p)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline"
                              style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '4px 8px' }}
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              title="Delete Product"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Users */}
        {activeTab === 'users' && (
          <div className="admin-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Phone / Address</th>
                    <th>Orders</th>
                    <th>Total Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td><span className="id-badge">#{u.id}</span></td>
                      <td>
                        <div className="user-cell">
                          <span className="user-avatar-small">{u.name ? u.name[0].toUpperCase() : 'U'}</span>
                          <span className="user-name-text">{u.name}</span>
                        </div>
                      </td>
                      <td className="text-secondary">{u.email}</td>
                      <td>
                        <small className="text-muted">
                          {u.phone ? `📞 ${u.phone}` : 'No phone'}
                          {u.address ? ` • 📍 ${u.address}` : ''}
                        </small>
                      </td>
                      <td><span className="badge-count">{u.total_orders || 0}</span></td>
                      <td className="font-semibold text-accent">
                        ₹{Number(u.total_spent || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Orders */}
        {activeTab === 'orders' && (
          <div className="admin-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total (₹)</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o.id}>
                      <td><span className="id-badge">#{o.id}</span></td>
                      <td>
                        <div className="order-customer-info">
                          <strong>{o.user_name}</strong>
                          <small className="text-muted">{o.user_email}</small>
                        </div>
                      </td>
                      <td className="text-muted">
                        {o.created_at ? new Date(o.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td><span className="badge-count">{o.item_count || 1} items</span></td>
                      <td className="font-semibold text-accent">
                        ₹{Number(o.total || 0).toFixed(2)}
                      </td>
                      <td><span className="payment-badge">{o.payment_method || 'Card'}</span></td>
                      <td>
                        <select
                          className="input-field"
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: '12px', 
                            width: 'auto', 
                            borderRadius: '6px', 
                            fontWeight: '600',
                            backgroundColor: o.status === 'delivered' ? 'rgba(34, 197, 94, 0.15)' : o.status === 'shipped' ? 'rgba(59, 130, 246, 0.15)' : o.status === 'cancelled' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            color: o.status === 'delivered' ? '#22c55e' : o.status === 'shipped' ? '#3b82f6' : o.status === 'cancelled' ? '#ef4444' : '#eab308'
                          }}
                          value={(o.status || 'pending').toLowerCase()}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        >
                          <option value="pending" style={{ color: '#000' }}>🟡 Pending</option>
                          <option value="confirmed" style={{ color: '#000' }}>🔵 Confirmed</option>
                          <option value="shipped" style={{ color: '#000' }}>🚚 Shipped</option>
                          <option value="delivered" style={{ color: '#000' }}>✅ Delivered</option>
                          <option value="cancelled" style={{ color: '#000' }}>❌ Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleViewOrder(o)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Change Admin Credentials */}
        {activeTab === 'credentials' && (
          <div className="glass-card admin-creds-card">
            <h2 className="admin-creds-title">🔑 Change Administrator Credentials</h2>
            <p className="admin-creds-sub">
              Update the master admin username, contact email, and password. Changes take effect immediately.
            </p>

            <form onSubmit={handleSaveAdminCredentials} className="admin-creds-form">
              <div className="input-group">
                <label htmlFor="change-admin-user">Admin Username *</label>
                <input
                  type="text"
                  id="change-admin-user"
                  className="input-field"
                  placeholder="e.g. admin or superuser"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="change-admin-email">Admin Contact Email</label>
                <input
                  type="email"
                  id="change-admin-email"
                  className="input-field"
                  placeholder="e.g. admin@freshmart.in"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label htmlFor="change-admin-pass">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  id="change-admin-pass"
                  className="input-field"
                  placeholder="Enter at least 6 characters"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                />
              </div>

              <div className="creds-action-row">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={savingCredentials}
                >
                  {savingCredentials ? '⟳ Updating...' : 'Save New Admin Credentials'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('inventory')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab: Customer Feedback & Suggestions */}
        {activeTab === 'feedback' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Customer Feedback & Suggestions</h2>
                <p className="admin-card-subtitle">Review feedback ratings, user opinions, and grocery requests submitted by shoppers.</p>
              </div>
              <span className="count-badge">{filteredFeedbacks.length} submissions</span>
            </div>

            {filteredFeedbacks.length === 0 ? (
              <div className="empty-table-state">
                <span className="empty-icon">💬</span>
                <p>No customer feedback matching your search query.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Rating</th>
                      <th>Customer</th>
                      <th>Category</th>
                      <th>Suggestion / Message</th>
                      <th>Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeedbacks.map((fb) => (
                      <tr key={fb.id}>
                        <td>
                          <span className="feedback-stars" title={`${fb.rating} Stars`}>
                            {'⭐'.repeat(fb.rating || 5)}
                          </span>
                        </td>
                        <td>
                          <div>
                            <strong>{fb.name}</strong>
                            <p className="user-email-text">{fb.email}</p>
                          </div>
                        </td>
                        <td>
                          <span className="category-pill">{fb.category}</span>
                        </td>
                        <td className="feedback-msg-cell">
                          <p className="feedback-msg-text">{fb.message}</p>
                        </td>
                        <td className="text-muted text-sm">
                          {new Date(fb.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Edit Stock Modal */}
        {editingProduct && (
          <div className="modal-backdrop" onClick={() => setEditingProduct(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Update Stock & Status: {editingProduct.name}</h3>
                <button className="modal-close" onClick={() => setEditingProduct(null)}>✕</button>
              </div>

              <form onSubmit={handleSaveStock}>
                <div className="modal-body">
                  <div className="input-group">
                    <label>Availability Status</label>
                    <select
                      className="input-field select-field"
                      value={editingProduct.status}
                      onChange={(e) => {
                        const newStat = e.target.value;
                        setEditingProduct({
                          ...editingProduct,
                          status: newStat,
                          stock: newStat === 'sold_out' ? 0 : (editingProduct.stock === 0 ? 50 : editingProduct.stock)
                        });
                      }}
                    >
                      <option value="available">Available (In Stock)</option>
                      <option value="sold_out">Sold Out (Out of Stock)</option>
                      <option value="coming_soon">Coming Soon</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Stock Count (Units)</label>
                    <input
                      type="number"
                      className="input-field"
                      min="0"
                      value={editingProduct.stock}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingProduct({
                          ...editingProduct,
                          stock: val,
                          status: val === 0 && editingProduct.status !== 'coming_soon' ? 'sold_out' : editingProduct.status
                        });
                      }}
                    />
                  </div>

                  <div className="input-group">
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    />
                  </div>

                  <div className="quick-stock-buttons">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingProduct({ ...editingProduct, status: 'sold_out', stock: 0 })}
                    >
                      Mark as Sold Out (0)
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingProduct({ ...editingProduct, status: 'coming_soon', stock: 0 })}
                    >
                      Mark as Coming Soon
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingProduct({ ...editingProduct, status: 'available', stock: 100 })}
                    >
                      Restock (100 units)
                    </button>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary" disabled={savingStock}>
                    {savingStock ? '⟳ Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingProduct(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Order #{selectedOrder.id} Details</h3>
                <button className="modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="order-summary-box">
                  <div className="summary-field">
                    <span>Customer:</span>
                    <strong>{selectedOrder.user_name} ({selectedOrder.user_email})</strong>
                  </div>
                  <div className="summary-field">
                    <span>Delivery Address:</span>
                    <span>{selectedOrder.shipping_address || selectedOrder.address}</span>
                  </div>
                  <div className="summary-field">
                    <span>Order Date:</span>
                    <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                  </div>
                  <div className="summary-field">
                    <span>Payment Method:</span>
                    <span className="capitalize">{selectedOrder.payment_method}</span>
                  </div>
                  <div className="summary-field">
                    <span>Order Total:</span>
                    <strong className="text-accent">₹{Number(selectedOrder.total).toFixed(2)}</strong>
                  </div>
                </div>

                <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Purchased Items</h4>
                {loadingOrderItems ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </div>
                ) : (
                  <div className="modal-items-list">
                    {orderItems.map((item) => (
                      <div key={item.id} className="modal-item-row">
                        <span className="modal-item-emoji">{item.emoji || '🛒'}</span>
                        <div className="modal-item-info">
                          <strong>{item.name}</strong>
                          <span className="text-muted">
                            ₹{Number(item.price).toFixed(2)} / {item.unit || 'unit'}
                          </span>
                        </div>
                        <div className="modal-item-qty">
                          Qty: <strong>{item.quantity}</strong>
                        </div>
                        <div className="modal-item-subtotal">
                          ₹{(Number(item.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        {isAddProductOpen && (
          <div className="modal-backdrop" onClick={() => setIsAddProductOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
              <div className="modal-header">
                <h3>➕ Add New Product to Catalog</h3>
                <button className="modal-close" onClick={() => setIsAddProductOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleAddProduct}>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="input-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Organic Avocados"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label>Category *</label>
                      <select
                        className="input-field"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        required
                      >
                        <option value="vegetables">🥦 Vegetables</option>
                        <option value="fruits">🍎 Fruits</option>
                        <option value="dairy">🥛 Dairy</option>
                        <option value="bakery">🍞 Bakery</option>
                        <option value="snacks">🍪 Snacks</option>
                        <option value="beverages">🧃 Beverages</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label>Unit (Weight/Vol) *</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. 1 kg or 500 g"
                        value={newProduct.unit}
                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label>Selling Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        placeholder="e.g. 120"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label>Original MRP (₹, optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        placeholder="e.g. 150"
                        value={newProduct.old_price}
                        onChange={(e) => setNewProduct({ ...newProduct, old_price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Icon Emoji</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="input-field"
                        style={{ width: '70px', fontSize: '20px', textAlign: 'center' }}
                        value={newProduct.emoji}
                        onChange={(e) => setNewProduct({ ...newProduct, emoji: e.target.value })}
                      />
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {['🍎', '🥦', '🥛', '🍞', '🍪', '🧃', '🥕', '🍓', '🥑', '🍋'].map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setNewProduct({ ...newProduct, emoji: em })}
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', padding: '4px 6px', fontSize: '16px' }}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label>Stock Count</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="50"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="input-group">
                      <label>Status</label>
                      <select
                        className="input-field"
                        value={newProduct.status}
                        onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                      >
                        <option value="available">Available</option>
                        <option value="coming_soon">Coming Soon</option>
                        <option value="sold_out">Sold Out</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Product Description</label>
                    <textarea
                      className="input-field"
                      rows={2}
                      placeholder="Short description of origin, freshness, or ingredients..."
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary" disabled={addingProduct}>
                    {addingProduct ? '⟳ Adding Product...' : 'Add to Catalog 🚀'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsAddProductOpen(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
