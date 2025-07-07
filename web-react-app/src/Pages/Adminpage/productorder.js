import React, { useEffect, useState } from 'react';

const OrderApproval = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const response = await fetch('/adminMethods/pendingorders', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPendingOrders(data.pending_orders);
        } else {
          setError('Failed to fetch pending orders.');
        }
      } catch (err) {
        setError('An error occurred while fetching pending orders.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOrders();
  }, []);

  const handleDecision = async (invoiceItemId, decision) => {
    try {
      const response = await fetch('/adminMethods/approveComment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_item_id: invoiceItemId,
          decision,
        }),
      });

      if (response.ok) {
        const updatedOrders = pendingOrders.filter(
          (order) => order.invoice_item_id !== invoiceItemId
        );
        setPendingOrders(updatedOrders);
      } else {
        console.error('Failed to update order status.');
      }
    } catch (err) {
      console.error('Error processing decision:', err);
    }
  };

  if (loading) return <p>Loading pending orders...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Order Approval</h2>
      {pendingOrders.length > 0 ? (
        <ul>
          {pendingOrders.map((order) => (
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
                  <strong>Purchased Date:</strong> {new Date(order.purchased_date).toLocaleString()}
                </p>
              </div>
              <div style={styles.buttonGroup}>
                <button
                  style={{ ...styles.button, backgroundColor: 'green' }}
                  onClick={() => handleDecision(order.invoice_item_id, 'accept')}
                >
                  Accept
                </button>
                <button
                  style={{ ...styles.button, backgroundColor: 'red' }}
                  onClick={() => handleDecision(order.invoice_item_id, 'deny')}
                >
                  Deny
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No pending orders to display.</p>
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

export default OrderApproval;
