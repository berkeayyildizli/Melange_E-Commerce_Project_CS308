import React, { useEffect, useState } from 'react';

const InvoiceManagement = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const fetchInvoices = async () => {
    if (!startDate || !endDate) {
      setError('Both start date and end date are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setInvoices([]);
      setFeedbackMessage('');
      const token = localStorage.getItem('adminToken');

      const url = `http://localhost:8000/salesManagerMethods/viewInvoices?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.orders || []);
        setFeedbackMessage('Invoices fetched successfully.');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to fetch invoices.');
      }
    } catch (err) {
      setError('An error occurred while fetching invoices.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (purchaseTime, customerId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const encodedPurchaseTime = encodeURIComponent(purchaseTime);
      const url = `http://localhost:8000/salesManagerMethods/generateInvoicePDF/${encodedPurchaseTime}/${customerId}`;
  
      // Open the invoice in a new tab
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        const blob = await response.blob();
        const urlObject = URL.createObjectURL(blob);
        window.open(urlObject, '_blank');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to view invoice.');
      }
    } catch (err) {
      setError('An error occurred while viewing the invoice.');
      console.error(err);
    }
  };
  const handleDownloadInvoice = async (purchaseTime, customerId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const encodedPurchaseTime = encodeURIComponent(purchaseTime);
      const url = `http://localhost:8000/salesManagerMethods/generateInvoicePDF/${encodedPurchaseTime}/${customerId}`;
  
      // Fetch the invoice PDF
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Invoice_${purchaseTime.replace(/[:]/g, '-')}_Customer_${customerId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to download invoice.');
      }
    } catch (err) {
      setError('An error occurred while downloading the invoice.');
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Invoice Management</h2>
      {feedbackMessage && <p style={{ color: 'green' }}>{feedbackMessage}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        <label>
          Start Date (yyyy/mm/dd):
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          End Date (yyyy/mm/dd):
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <button style={styles.button} onClick={fetchInvoices}>
          Fetch Invoices
        </button>
      </div>
      {loading && <p>Loading invoices...</p>}
      {invoices.length > 0 ? (
        <ul>
          {invoices.map((order, index) => (
            <li key={index} style={styles.invoiceItem}>
              <div>
                <p>
                  <strong>Purchase Time:</strong> {new Date(order.purchase_time).toLocaleString()}
                </p>
                <p>
                  <strong>Customer:</strong> {order.items[0]?.customer_name || 'N/A'}
                </p>
                <ul>
                  {order.items.map((item) => (
                    <li key={item.invoice_item_id} style={styles.itemDetails}>
                      <p>
                        <strong>Product:</strong> {item.base_product_id || 'N/A'} - {item.color_name || 'N/A'} ({item.size_name || 'N/A'})
                      </p>
                      <p>
                        <strong>Price:</strong> ${item.price_at_purchase} x {item.product_quantity}
                      </p>
                      <p>
                        <strong>Delivery Status:</strong> {item.delivery_status}
                      </p>
                    </li>
                  ))}
                </ul>
                <div style={styles.buttonGroup}>
                  <button
                    style={{ ...styles.button, backgroundColor: '#007bff' }}
                    onClick={() => handleViewInvoice(order.purchase_time, order.items[0]?.customer_id)}
                  >
                    View Invoice
                  </button>
                  <button
                    style={{ ...styles.button, backgroundColor: '#28a745' }}
                    onClick={() => handleDownloadInvoice(order.purchase_time, order.items[0]?.customer_id)}
                  >
                    Download Invoice
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p>No invoices available for the selected dates.</p>
      )}
    </div>
  );
};

const styles = {
  button: {
    padding: '10px 20px',
    marginTop: '10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  invoiceItem: {
    padding: '15px',
    margin: '15px 0',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
  },
  itemDetails: {
    marginTop: '10px',
    borderTop: '1px solid #ddd',
    paddingTop: '10px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
};

export default InvoiceManagement;
