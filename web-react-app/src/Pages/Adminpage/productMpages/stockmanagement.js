import React, { useEffect, useState } from 'react';

const StatusManagement = () => {
  const [products, setProducts] = useState([]);
  const [sortedProducts, setSortedProducts] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc'); // Default sorting order
  const [searchTerm, setSearchTerm] = useState('');
  const [productId, setProductId] = useState('');
  const [colorName, setColorName] = useState('');
  const [sizeName, setSizeName] = useState('');
  const [productStock, setProductStock] = useState('');
  const [error, setError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Fetch products with stock details
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
        setSortedProducts(data.products || []);
      } else {
        setError('Failed to fetch products.');
      }
    } catch (err) {
      setError('An error occurred while fetching products.');
    }
  };

  // Handle stock update
  const handleStockUpdate = async () => {
    try {
      setFeedbackMessage('');
      setError('');

      const stockAsInt = parseInt(productStock, 10);

      if (!productId || !colorName || !sizeName || isNaN(stockAsInt)) {
        setError('Please fill in all fields with valid values.');
        return;
      }

      const token = localStorage.getItem('adminToken');
      const payload = {
        base_product_id: parseInt(productId, 10),
        color_name: colorName,
        size_name: sizeName,
        product_stock: stockAsInt,
      };

      const response = await fetch('/adminMethods/adjustStock', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setFeedbackMessage('Stock updated successfully.');
        setProductId('');
        setColorName('');
        setSizeName('');
        setProductStock('');
        fetchProducts(); // Refresh the product list
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update stock.');
      }
    } catch (err) {
      setError('An error occurred while updating stock.');
      console.error(err);
    }
  };

  // Sort products by stock quantity
  const handleSort = (order) => {
    const sorted = [...products].sort((a, b) =>
      order === 'asc' ? a.product_stock - b.product_stock : b.product_stock - a.product_stock
    );
    setSortedProducts(sorted);
    setSortOrder(order);
  };

  // Filter products based on search term
  const filteredProducts = sortedProducts.filter(
    (product) =>
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.base_product_id.toString().includes(searchTerm)
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>Stock Management</h2>
      {feedbackMessage && <p style={{ color: 'green', textAlign: 'center' }}>{feedbackMessage}</p>}
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      {/* Update Stock Section */}
      <section style={{ marginBottom: '30px' }}>
        <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', color: '#007bff' }}>Update Stock</h3>
        <div style={{ display: 'grid', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Enter Product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="Enter Color Name"
            value={colorName}
            onChange={(e) => setColorName(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="Enter Size Name"
            value={sizeName}
            onChange={(e) => setSizeName(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <input
            type="number"
            placeholder="Enter Product Stock"
            value={productStock}
            onChange={(e) => setProductStock(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button
            onClick={handleStockUpdate}
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Update Stock
          </button>
        </div>
      </section>

      {/* Product List with Search and Sorting */}
      <section>
        <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', color: '#007bff' }}>Current Products</h3>
        <div style={{ marginBottom: '20px', textAlign: 'right' }}>
          <input
            type="text"
            placeholder="Search by Name or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '10px', width: '60%', marginRight: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button
            onClick={() => handleSort('asc')}
            style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Sort by Stock (Asc)
          </button>
          <button
            onClick={() => handleSort('desc')}
            style={{ padding: '5px 10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Sort by Stock (Desc)
          </button>
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
                  <strong>ID:</strong> {product.base_product_id}, <strong>Name:</strong> {product.product_name}, <strong>Color:</strong> {product.color_name}, <strong>Size:</strong> {product.size_name}, <strong>Stock:</strong> {product.product_stock}
                </p>
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

export default StatusManagement;
