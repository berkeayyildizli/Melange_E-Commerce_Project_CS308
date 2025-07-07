import React, { useState, useEffect } from 'react';

const DiscountManagement = () => {
  const [products, setProducts] = useState([]);
  const [sortedProducts, setSortedProducts] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc'); // Default sorting order
  const [searchTerm, setSearchTerm] = useState('');
  const [productId, setProductId] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch unique products by ID
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
        const uniqueProductsMap = {};

        // Filter unique products based on `base_product_id`
        data.products.forEach((product) => {
          if (!uniqueProductsMap[product.base_product_id]) {
            uniqueProductsMap[product.base_product_id] = product;
          }
        });

        const uniqueProductsArray = Object.values(uniqueProductsMap);
        setProducts(uniqueProductsArray);
        setSortedProducts(uniqueProductsArray);
      } else {
        setError('Failed to fetch products.');
      }
    } catch (err) {
      setError('An error occurred while fetching products.');
    }
  };

  // Handle discount update
  const handleDiscountUpdate = async () => {
    try {
      setFeedbackMessage('');
      setError('');
      const token = localStorage.getItem('adminToken');

      const discountAsInt = parseInt(newDiscount, 10);

      if (!productId || isNaN(discountAsInt) || discountAsInt < 0 || discountAsInt > 100) {
        setError('Please enter a valid discount (0-100).');
        return;
      }

      const url = `http://localhost:8000/salesManagerMethods/update-discount?base_product_id=${productId}&new_discount=${discountAsInt}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFeedbackMessage(data.message || `Discount updated successfully for Product ID: ${productId}.`);
        fetchProducts(); // Refresh product list
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update the discount.');
      }
    } catch (err) {
      setError('An error occurred while updating the discount.');
      console.error(err);
    }
  };

  // Sort products by discount percentage
  const handleSort = (order) => {
    const sorted = [...filteredProducts].sort((a, b) => {
      const discountA = a.discount_percentage ?? 0;
      const discountB = b.discount_percentage ?? 0;

      return order === 'asc' ? discountA - discountB : discountB - discountA;
    });
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
      <h2 style={{ textAlign: 'center', color: '#333' }}>Discount Management</h2>
      {feedbackMessage && <p style={{ color: '#28a745', textAlign: 'center' }}>{feedbackMessage}</p>}
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      {/* Update Discount Section */}
      <section style={{ marginBottom: '30px' }}>
        <h3 style={{ borderBottom: '2px solid #28a745', paddingBottom: '10px', color: '#28a745' }}>Update Discount</h3>
        <div style={{ display: 'grid', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Enter Product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <input
            type="number"
            placeholder="Enter New Discount (%)"
            value={newDiscount}
            onChange={(e) => setNewDiscount(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button
            onClick={handleDiscountUpdate}
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Update Discount
          </button>
        </div>
      </section>

      {/* Product List with Search and Sorting */}
      <section>
        <h3 style={{ borderBottom: '2px solid #28a745', paddingBottom: '10px', color: '#28a745' }}>Current Products</h3>
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
            style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Sort by Discount (Asc)
          </button>
          <button
            onClick={() => handleSort('desc')}
            style={{ padding: '5px 10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Sort by Discount (Desc)
          </button>
        </div>
        {filteredProducts.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {filteredProducts.map((product) => (
              <li
                key={product.base_product_id}
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
                  <strong>ID:</strong> {product.base_product_id}, <strong>Name:</strong> {product.product_name}, <strong>Discount:</strong> {product.discount_percentage}%
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

export default DiscountManagement;
