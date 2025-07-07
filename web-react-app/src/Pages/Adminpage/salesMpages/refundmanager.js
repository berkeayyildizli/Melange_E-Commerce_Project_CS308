import React, { useEffect, useState } from 'react';

const RefundApproval = () => {
  const [pendingRefunds, setPendingRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    const fetchPendingRefunds = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/adminMethods/pendingRefunds', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPendingRefunds(data.pending_refunds || []);
        } else {
          const data = await response.json();
          setError(data.message || 'Failed to fetch pending refunds.');
        }
      } catch (err) {
        setError('An error occurred while fetching pending refunds.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRefunds();
  }, []);

  const handleRefundDecision = async (invoiceItemId, decision) => {
    try {
      setFeedbackMessage('');
      const token = localStorage.getItem('adminToken');
      const newStatus = decision === 'approve' ? 6 : 7; // 6: Approved, 7: Denied

      const response = await fetch('/adminMethods/approveRefund', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_item_id: invoiceItemId,
          new_status: newStatus,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedbackMessage(data.message || `Refund ${decision}d successfully for order ${invoiceItemId}.`);
        // Remove this refunded item from the list
        setPendingRefunds((prevRefunds) =>
          prevRefunds.filter((refund) => refund.invoice_item_id !== invoiceItemId)
        );
      } else {
        const data = await response.json();
        setError(data.message || `Failed to ${decision} refund.`);
      }
    } catch (err) {
      setError(`An error occurred while processing the refund ${decision}.`);
      console.error(err);
    }
  };

  if (loading) return <p>Loading pending refunds...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Refund Approval</h2>
      {feedbackMessage && <p style={{ color: 'green' }}>{feedbackMessage}</p>}
      {pendingRefunds.length > 0 ? (
        <ul>
          {pendingRefunds.map((refund) => (
            <li key={refund.invoice_item_id} style={styles.refundItem}>
              <div>
                <p>
                  <strong>Order ID:</strong> {refund.invoice_item_id}
                </p>
                <p>
                  <strong>Customer ID:</strong> {refund.customer_id}
                </p>
                <p>
                  <strong>Price:</strong> ${refund.price_at_purchase}
                </p>
                <p>
                  <strong>Quantity:</strong> {refund.product_quantity}
                </p>
                <p>
                  <strong>Product:</strong> #{refund.base_product_id} ({refund.color_name}, {refund.size_name})
                </p>
                <p>
                  <strong>Purchased Date:</strong>{' '}
                  {new Date(refund.purchased_date).toLocaleString()}
                </p>
                {/* NEW: Display the shipping/home address */}
                <p>
                  <strong>Shipping Address:</strong> {refund.home_address}
                </p>
              </div>
              <div style={styles.buttonGroup}>
                <button
                  style={{ ...styles.button, backgroundColor: 'green' }}
                  onClick={() => handleRefundDecision(refund.invoice_item_id, 'approve')}
                >
                  Approve
                </button>
                <button
                  style={{ ...styles.button, backgroundColor: 'red' }}
                  onClick={() => handleRefundDecision(refund.invoice_item_id, 'deny')}
                >
                  Deny
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No pending refunds to display.</p>
      )}
    </div>
  );
};

const styles = {
  refundItem: {
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

export default RefundApproval;
