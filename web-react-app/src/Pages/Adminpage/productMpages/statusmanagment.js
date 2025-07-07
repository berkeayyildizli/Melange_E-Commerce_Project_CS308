import React, { useEffect, useState } from 'react';

const STATUS_MAP = {
  0: 'Received',
  1: 'Processing',
  2: 'Shipped',
  3: 'In-Transit',
  4: 'Completed',
  5: 'Refund Requested',
  6: 'Refund Approved',
  7: 'Refund Not Approved',
  8: 'Canceled',
};

const StatusManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/adminMethods/returnOrderStatus', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
        } else {
          setError('Failed to fetch orders.');
        }
      } catch (err) {
        setError('An error occurred while fetching orders.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleChangeStatus = async (invoiceItemId, newStatus) => {
    try {
      setFeedbackMessage('');
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/adminMethods/changeOrderStatus', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_item_id: invoiceItemId,
          new_status: newStatus,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFeedbackMessage(`Order ${invoiceItemId} status updated successfully.`);
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.invoice_item_id === invoiceItemId
              ? { ...order, delivery_status: newStatus }
              : order
          )
        );
      } else {
        setFeedbackMessage(data.message || 'Failed to update order status.');
      }
    } catch (err) {
      setFeedbackMessage('An error occurred while updating the order status.');
      console.error(err);
    }
  };

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Status Manager</h2>
      {feedbackMessage && <p style={{ color: 'green' }}>{feedbackMessage}</p>}
      {orders.length > 0 ? (
        <ul>
          {orders.map((order) => (
            <li key={order.invoice_item_id} style={styles.orderItem}>
              <div>
                <p>
                  <strong>Order ID:</strong> {order.invoice_item_id}
                </p>
                <p>
                  <strong>Customer ID:</strong> {order.customer_id}
                </p>
                <p>
                  <strong>Price:</strong> ${order.price_at_purchase}
                </p>
                <p>
                  <strong>Quantity:</strong> {order.product_quantity}
                </p>
                <p>
                  <strong>Product:</strong> #{order.base_product_id} ({order.color_name}, {order.size_name})
                </p>
                <p>
                  <strong>Status:</strong> {STATUS_MAP[order.delivery_status]}
                </p>
                <p>
                  <strong>Purchased Date:</strong>{' '}
                  {new Date(order.purchased_date).toLocaleString()}
                </p>
                {/* NEW: Display the shipping address */}
                <p>
                  <strong>Shipping Address:</strong> {order.home_address}
                </p>
              </div>
              <div style={styles.buttonGroup}>
                <button
                  style={{ ...styles.button, backgroundColor: 'blue' }}
                  onClick={() =>
                    handleChangeStatus(
                      order.invoice_item_id,
                      Math.max(order.delivery_status - 1, 0)
                    )
                  }
                  disabled={order.delivery_status <= 0}
                >
                  Decrease Status
                </button>
                <button
                  style={{ ...styles.button, backgroundColor: 'green' }}
                  onClick={() =>
                    handleChangeStatus(
                      order.invoice_item_id,
                      Math.min(order.delivery_status + 1, 4)
                    )
                  }
                  disabled={order.delivery_status >= 4}
                >
                  Increase Status
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No orders to display.</p>
      )}
    </div>
  );
};

const styles = {
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  button: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    cursor: 'pointer',
  },
};

export default StatusManager;
