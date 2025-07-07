import React, { useEffect, useState } from 'react';
import './userpage.css'; // Import the updated CSS file

const STATUS_MAP = {
  5: 'Refund Requested',
  6: 'Refund Approved',
  7: 'Refund Not Approved',
};

const MyRefunds = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // Default filter is 'all'

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('User is not authenticated');

      const response = await fetch('/account/myrefunds', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch orders');

      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on the selected filter
  const filteredOrders = orders.map((order) => ({
    ...order,
    items: order.items.filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'approved') return item.delivery_status === 6;
      if (filter === 'requested') return item.delivery_status === 5;
      if (filter === 'notApproved') return item.delivery_status === 7;
      return true;
    }),
  })).filter((order) => order.items.length > 0); // Filter out orders with no items after filtering

  return (
    <div className="account-orders">
      <h2>My Refunds</h2>

      {error && <p className="account-error-message">{error}</p>}

      <div className="refund-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'approved' ? 'active' : ''}
          onClick={() => setFilter('approved')}
        >
          Approved
        </button>
        <button
          className={filter === 'requested' ? 'active' : ''}
          onClick={() => setFilter('requested')}
        >
          Requested
        </button>
        <button
          className={filter === 'notApproved' ? 'active' : ''}
          onClick={() => setFilter('notApproved')}
        >
          Not Approved
        </button>
      </div>

      {loading ? (
        <p>Loading refunds...</p>
      ) : (
        filteredOrders.map((order, index) => (
          <div key={index} className="account-order-group">
            <h3>Purchase Time: {order.purchase_time}</h3>
            <ul className="account-slidable">
              {order.items.map((item) => (
                <li key={item.invoice_item_id} className="account-item">
                  <div className="account-item-details">
                    <p>
                      Product: {item.base_product_id} - {item.color_name} - {item.size_name}
                    </p>
                    <p>Quantity: {item.product_quantity}</p>
                    <p>Price: {item.price_at_purchase} $</p>
                    <p>Status: {STATUS_MAP[item.delivery_status]}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default MyRefunds;
