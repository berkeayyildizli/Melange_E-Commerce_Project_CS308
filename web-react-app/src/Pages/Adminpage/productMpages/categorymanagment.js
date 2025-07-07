import React, { useEffect, useState } from 'react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', gender: '' });
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/adminMethods/categories', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      } else {
        setError('Failed to fetch categories.');
      }
    } catch (err) {
      setError('An error occurred while fetching categories.');
    }
  };

  const createCategory = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/adminMethods/createCategory', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_name: newCategory.name,
          category_gender: newCategory.gender,
        }),
      });
      if (response.ok) {
        fetchCategories();
        setNewCategory({ name: '', gender: '' });
        setError('');
      } else {
        setError('Failed to create category.');
      }
    } catch (err) {
      setError('An error occurred while creating category.');
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/adminMethods/deleteCategory/${categoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchCategories();
        setError('');
      } else {
        setError('Failed to delete category.');
      }
    } catch (err) {
      setError('An error occurred while deleting category.');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>Category Management</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      <section style={{ marginBottom: '30px' }}>
        <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', color: '#007bff' }}>Create Category</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Category Name"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', flex: '1' }}
          />
          <select
            value={newCategory.gender}
            onChange={(e) => setNewCategory({ ...newCategory, gender: e.target.value })}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', flex: '1' }}
          >
            <option value="">Select Gender</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Teen">Teen</option>
          </select>
          <button
            onClick={createCategory}
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Create
          </button>
        </div>
      </section>

      <section>
        <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', color: '#007bff' }}>Current Categories</h3>
        {categories.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {categories.map((category) => (
              <li
                key={category.category_id}
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
                  <strong>ID:</strong> {category.category_id}, <strong>Name:</strong> {category.category_name},{' '}
                  <strong>Gender:</strong> {category.category_gender}
                </p>
                <button
                  onClick={() => deleteCategory(category.category_id)}
                  style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ textAlign: 'center', color: '#555' }}>No categories available.</p>
        )}
      </section>
    </div>
  );
};

export default CategoryManagement;
