import React, { useEffect, useState } from 'react';
import './userpage.css'; // Import the updated CSS file



const STATUS_MAP = {
  0: 'Processing',
  1: 'Ready to Ship',
  2: 'Shipped',
  3: 'In-Transit',
  4: 'Delivered',
  5: 'Refund Requested',
  6: 'Refund Approved',
  7: 'Refund Not Approved',
  8: 'Order Is Cancelled',
};

const MyOrders = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');


  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('User is not authenticated');

      const response = await fetch('/account/invoices', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch orders');
      const updatedOrders = data.orders.map((order) => ({
        ...order,
        items: order.items.map((item) => ({
          ...item,
          showCommentField: false,
          showRatingField: false,
          comment: '',
          rating: '',
        })),
      }))
      .sort((a, b) => new Date(b.purchase_time) - new Date(a.purchase_time)); // Sort orders by purchase_time in descending order
      setOrders(updatedOrders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFieldVisibility = (item, field) => {
    const updatedOrders = orders.map((order) => ({
      ...order,
      items: order.items.map((orderItem) =>
        orderItem.invoice_item_id === item.invoice_item_id
          ? { ...orderItem, [`show${capitalize(field)}Field`]: !orderItem[`show${capitalize(field)}Field`] }
          : orderItem
      ),
    }));
    setOrders(updatedOrders);
  };

  const updateItemState = (item, field, value) => {
    const updatedOrders = orders.map((order) => ({
      ...order,
      items: order.items.map((orderItem) =>
        orderItem.invoice_item_id === item.invoice_item_id
          ? { ...orderItem, [field]: value }
          : orderItem
      ),
    }));
    setOrders(updatedOrders);
  };

  const handleComment = async (productId, item) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('User is not authenticated');

      await fetch('/commentRating/comment', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, comment_content: item.comment }),
      });
      toggleFieldVisibility(item, 'comment');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRating = async (productId, item) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('User is not authenticated');

      const ratingValue = parseInt(item.rating, 10); // Ensure the value is converted to an integer
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        throw new Error('Rating must be an integer between 1 and 5.');
      }

      await fetch('/commentRating/rating', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, customer_rate: ratingValue }),
      });
      toggleFieldVisibility(item, 'rating');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRefund = async (invoiceItemId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('User is not authenticated');

      const response = await fetch('/account/refund', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_item_id: invoiceItemId }),
    });

      const data = await response.json();
      if (data.status === 'success') {
        setSuccessMessage('Your refund request has been submitted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000); // Message disappears after 3 seconds
        await fetchOrders(); // Refresh orders to reflect updated status
      } else {
        throw new Error(data.message || 'Failed to request refund');
      }


    } catch (err) {
      setError(err.message);
    }
  };

  const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const handleCancelPurchase = async (purchaseTime) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User is not authenticated");

    // Find the first item matching the purchase time
    const orderToCancel = orders.find(
      (order) => order.purchase_time === purchaseTime
    );

    if (!orderToCancel) throw new Error("Order not found");

    // Get the invoice_item_id of the first item in the order group
    const invoiceItemId = orderToCancel.items[0]?.invoice_item_id;

    if (!invoiceItemId) throw new Error("No valid invoice item found for cancellation");

    // Call the cancelOrder API
    const response = await fetch("/account/cancelOrder", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ invoice_item_id: invoiceItemId }),
    });

    const data = await response.json();

    if (data.status === "success") {
      setSuccessMessage("Your order group has been cancelled successfully!");
      setTimeout(() => setSuccessMessage(""), 3000); // Clear the message after 3 seconds
      await fetchOrders(); // Refresh the orders to update the status
    } else {
      throw new Error(data.message || "Failed to cancel the order group");
    }
  } catch (err) {
    setError(err.message);
  }
};



  return (
    <div className="account-orders">
      <h2>My Orders</h2>
      {successMessage && <div className="success-toast">{successMessage}</div>}
      {loading ? (
        <p>Loading orders...</p>
      ) : error ? (
        <p className="account-error-message">{error}</p>
      ) : (
        orders.map((order, index) => (
          <div key={index} className="account-order-group">
            <h3>Purchase Time: {order.purchase_time}</h3>
            {order.items.every((item) => item.delivery_status === 0 || item.delivery_status === 1) && (
            <button className="account-cancel-button" onClick={() => handleCancelPurchase(order.purchase_time)}>
              Cancel Purchase
            </button>
          )}

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
                  {item.delivery_status === 4 && (
                    <div className="account-actions">
                      {!item.showCommentField ? (
                        <button className="account-comment-button" onClick={() => toggleFieldVisibility(item, 'comment')}>
                          Add Comment
                        </button>
                      ) : (
                        <div className="account-comment-section">
                          <textarea
                            value={item.comment}
                            onChange={(e) => updateItemState(item, 'comment', e.target.value)}
                            placeholder="Write your comment"
                          />
                          <div className="action-buttons">
                            <button
                              className="submit-button"
                              onClick={() => handleComment(item.base_product_id, item)}
                            >
                              Submit
                            </button>
                            <button
                              className="cancel-button"
                              onClick={() => toggleFieldVisibility(item, 'comment')}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {!item.showRatingField ? (
                        <button className="account-rate-button" onClick={() => toggleFieldVisibility(item, 'rating')}>
                          Add Rating
                        </button>
                      ) : (
                        <div className="account-rating-section">
                          <input
                            type="number"
                            value={item.rating}
                            onChange={(e) => updateItemState(item, 'rating', e.target.value)}
                            placeholder="Rating (1-5)"
                            min="1"
                            max="5"
                          />
                          <div className="action-buttons">
                            <button
                              className="account-submit-button"
                              onClick={() => handleRating(item.base_product_id, item)}
                            >
                              Submit
                            </button>
                            <button
                              className="account-cancel-button"
                              onClick={() => toggleFieldVisibility(item, 'rating')}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <button className="account-refund-button" onClick={() => handleRefund(item.invoice_item_id)}>
                        Request Refund
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default MyOrders;