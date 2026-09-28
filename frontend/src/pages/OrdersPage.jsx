import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import './OrdersPage.css';

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
  }, [isAuthenticated]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const data = await api.getOrders();
      setOrders(data.orders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleOrder(orderId) {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);
    if (!orderDetails[orderId]) {
      try {
        const data = await api.getOrder(orderId);
        setOrderDetails(prev => ({ ...prev, [orderId]: data.order }));
      } catch (err) {
        console.error('Failed to fetch order details:', err);
      }
    }
  }

  const statusColors = {
    confirmed: 'badge-green',
    processing: 'badge-orange',
    delivered: 'badge-blue',
  };

  if (!isAuthenticated) {
    return (
      <div className="orders-page page-container">
        <div className="container">
          <div className="empty-cart animate-fade-in-up">
            <span className="empty-cart-icon">🔒</span>
            <h2>Sign in to view your orders</h2>
            <p>You need to be logged in to see your order history</p>
            <Link to="/login" className="btn btn-primary">Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page page-container">
      <div className="container">
        <div className="orders-header animate-fade-in-up">
          <h1 className="page-title">📦 My Orders</h1>
          <p className="page-subtitle">Track and manage your order history</p>
        </div>

        {loading ? (
          <div className="orders-list">
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16, marginBottom: 12 }} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-cart animate-fade-in-up">
            <span className="empty-cart-icon">📦</span>
            <h2>No orders yet</h2>
            <p>Start shopping to see your orders here</p>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order, i) => (
              <div
                className="order-card glass-card animate-fade-in-up"
                key={order.id}
                style={{ animationDelay: `${i * 0.05}s` }}
                id={`order-${order.id}`}
              >
                <div className="order-header-row" onClick={() => toggleOrder(order.id)}>
                  <div className="order-id-col">
                    <span className="order-id">Order #{order.id}</span>
                    <span className="order-date">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="order-meta-col">
                    <span className={`badge ${statusColors[order.status] || 'badge-green'}`}>{order.status}</span>
                    <span className="order-total">₹{order.total.toFixed(2)}</span>
                    <span className="order-count">{order.item_count} items</span>
                  </div>
                  <span className={`expand-icon ${expandedOrder === order.id ? 'expanded' : ''}`}>▼</span>
                </div>

                {expandedOrder === order.id && orderDetails[order.id] && (
                  <div className="order-details animate-fade-in">
                    <div className="order-items-list">
                      {orderDetails[order.id].items?.map(item => (
                        <div className="order-detail-item" key={item.id}>
                          <span className="order-item-emoji">{item.emoji}</span>
                          <span className="order-item-name">{item.name}</span>
                          <span className="order-item-qty">×{item.quantity}</span>
                          <span className="order-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-address">
                      <span className="address-label">📍 Delivery Address:</span>
                      <span>{orderDetails[order.id].address}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
