import React, { useEffect, useState } from 'react';

const RemoveManagement = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productId, setProductId] = useState('');
  const [error, setError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Fetch all products
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/adminMethods/getAllProducts', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        setError('Failed to fetch products.');
      }
    } catch (err) {
      setError('An error occurred while fetching products.');
    }
  };

  // Handle product removal by ID
  const handleManualProductRemoval = async () => {
    try {
      setFeedbackMessage('');
      setError('');

      if (!productId) {
        setError('Please enter a valid Product ID.');
        return;
      }

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/adminMethods/deleteProduct/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setFeedbackMessage(`Product with ID: ${productId} removed successfully.`);
        setProductId('');
        fetchProducts(); // Refresh the product list
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to remove product.');
      }
    } catch (err) {
      setError('An error occurred while removing the product.');
      console.error(err);
    }
  };

  // Handle product removal from the list
  const handleProductRemoval = async (id) => {
    try {
      setFeedbackMessage('');
      setError('');

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/adminMethods/deleteProduct/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setFeedbackMessage(`Product with ID: ${id} removed successfully.`);
        fetchProducts(); // Refresh the product list
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to remove product.');
      }
    } catch (err) {
      setError('An error occurred while removing the product.');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.base_product_id.toString().includes(searchTerm)
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>Remove Product</h2>
      {feedbackMessage && <p style={{ color: 'green', textAlign: 'center' }}>{feedbackMessage}</p>}
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      {/* Manual Remove Section */}
      <section style={{ marginBottom: '30px' }}>
        <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', color: '#007bff' }}>Delete a Product by ID</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Enter Product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', flex: '1' }}
          />
          <button
            onClick={handleManualProductRemoval}
            style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Remove
          </button>
        </div>
      </section>

      {/* Product List with Search */}
      <section>
        <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', color: '#007bff' }}>Current Products</h3>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by Name or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '10px', width: '100%', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        {filteredProducts.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {filteredProducts.map((product) => (
              <li
                key={`${product.base_product_id}-${product.color_name}-${product.size_name}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  borderBottom: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  marginBottom: '10px',
                }}
              >
                <p style={{ margin: 0, color: '#333' }}>
                  <strong>ID:</strong> {product.base_product_id}, <strong>Name:</strong> {product.product_name}, <strong>Category:</strong> {product.category_name}, <strong>Color:</strong> {product.color_name}, <strong>Size:</strong> {product.size_name}, <strong>Price:</strong> {product.price} TL, <strong>Discount:</strong> {product.discount_percentage}%, <strong>Stock:</strong> {product.product_stock}
                </p>
                <button
                  onClick={() => handleProductRemoval(product.base_product_id)}
                  style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ textAlign: 'center', color: '#555' }}>No products match your search.</p>
        )}
      </section>
    </div>
  );
};

export default RemoveManagement;
