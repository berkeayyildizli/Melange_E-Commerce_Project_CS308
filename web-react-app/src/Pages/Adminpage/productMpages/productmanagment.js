import React, { useEffect, useState } from 'react';
import './productmanagment.css';

const ProductManagement = () => {
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({
    category_id: 0,
    product_name: '',
    model: 0,
    serial_number: 0,
    price: 0,
    warranty_status: 0,
    distributor: '',
    discount_percentage: 0,
    colors: [
      {
        color_name: '',
        color_description: '',
        product_image: '',
        sizes: [{ size_name: '', product_stock: 0 }],
      },
    ],
  });
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

  const handleAddColor = () => {
    setNewProduct({
      ...newProduct,
      colors: [
        ...newProduct.colors,
        {
          color_name: '',
          color_description: '',
          product_image: '',
          sizes: [{ size_name: '', product_stock: 0 }],
        },
      ],
    });
  };

  const handleRemoveColor = (index) => {
    const updatedColors = [...newProduct.colors];
    updatedColors.splice(index, 1);
    setNewProduct({ ...newProduct, colors: updatedColors });
  };

  const handleAddSize = (colorIndex) => {
    const updatedColors = [...newProduct.colors];
    updatedColors[colorIndex].sizes.push({ size_name: '', product_stock: 0 });
    setNewProduct({ ...newProduct, colors: updatedColors });
  };

  const handleRemoveSize = (colorIndex, sizeIndex) => {
    const updatedColors = [...newProduct.colors];
    updatedColors[colorIndex].sizes.splice(sizeIndex, 1);
    setNewProduct({ ...newProduct, colors: updatedColors });
  };

  const createProduct = async () => {
    // Validation: Ensure all required fields are filled
    if (!newProduct.product_name || !newProduct.category_id || newProduct.colors.length === 0) {
      setError('Please fill in all required fields.');
      return;
    }

    console.log('Creating Product:', newProduct);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/adminMethods/createProduct', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        alert('Product created successfully!');
        setNewProduct({
          category_id: 0,
          product_name: '',
          model: 0,
          serial_number: 0,
          price: 0,
          warranty_status: 0,
          distributor: '',
          discount_percentage: 0,
          colors: [
            {
              color_name: '',
              color_description: '',
              product_image: '',
              sizes: [{ size_name: '', product_stock: 0 }],
            },
          ],
        });
        setError('');
      } else {
        setError('Failed to create product.');
      }
    } catch (err) {
      setError('An error occurred while creating product.');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="PM_container">
      <h2 className="PM_heading">Product Management</h2>
      {error && <p className="PM_error">{error}</p>}

      <section className="PM_section">
        <h3 className="PM_section_heading">Create Product</h3>

        <div>
          <label>Category</label>
          <select
            value={newProduct.category_id}
            onChange={(e) =>
              setNewProduct({ ...newProduct, category_id: parseInt(e.target.value, 10) })
            }
            className="PM_select"
          >
            <option value={0}>Select Category</option>
            {categories.map((category) => (
              <option key={category.category_id} value={category.category_id}>
                {category.category_name} ({category.category_gender})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Product Name</label>
          <input
            type="text"
            value={newProduct.product_name}
            onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
            className="PM_input"
          />
        </div>

        <div>
          <label>Distributor</label>
          <input
            type="text"
            value={newProduct.distributor}
            onChange={(e) => setNewProduct({ ...newProduct, distributor: e.target.value })}
            className="PM_input"
          />
        </div>

        <div>
          <label>Model</label>
          <input
            type="number"
            value={newProduct.model}
            onChange={(e) => setNewProduct({ ...newProduct, model: parseInt(e.target.value, 10) })}
            className="PM_input"
          />
        </div>

        <div>
          <label>Serial Number</label>
          <input
            type="number"
            value={newProduct.serial_number}
            onChange={(e) =>
              setNewProduct({ ...newProduct, serial_number: parseInt(e.target.value, 10) })
            }
            className="PM_input"
          />
        </div>

        <div>
          <label>Warranty Status</label>
          <select
            value={newProduct.warranty_status}
            onChange={(e) =>
              setNewProduct({ ...newProduct, warranty_status: parseInt(e.target.value, 10) })
            }
            className="PM_select"
          >
            <option value={0}>No Warranty</option>
            <option value={1}>Warranty</option>
          </select>
        </div>

        {newProduct.colors.map((color, colorIndex) => (
          <div key={colorIndex} className="PM_color_card">
            <h4 className="PM_color_heading">Color {colorIndex + 1}</h4>
            <div>
              <label>Color Name</label>
              <input
                type="text"
                value={color.color_name}
                onChange={(e) => {
                  const updatedColors = [...newProduct.colors];
                  updatedColors[colorIndex].color_name = e.target.value;
                  setNewProduct({ ...newProduct, colors: updatedColors });
                }}
                className="PM_input"
              />
            </div>
            <div>
              <label>Color Description</label>
              <textarea
                value={color.color_description}
                onChange={(e) => {
                  const updatedColors = [...newProduct.colors];
                  updatedColors[colorIndex].color_description = e.target.value;
                  setNewProduct({ ...newProduct, colors: updatedColors });
                }}
                className="PM_input"
              />
            </div>
            {color.sizes.map((size, sizeIndex) => (
              <div key={sizeIndex}>
                <label>Size {sizeIndex + 1}</label>
                <input
                  type="text"
                  value={size.size_name}
                  onChange={(e) => {
                    const updatedColors = [...newProduct.colors];
                    updatedColors[colorIndex].sizes[sizeIndex].size_name = e.target.value;
                    setNewProduct({ ...newProduct, colors: updatedColors });
                  }}
                  className="PM_input"
                  placeholder="Size Name"
                />
                <input
                  type="number"
                  value={size.product_stock}
                  onChange={(e) => {
                    const updatedColors = [...newProduct.colors];
                    updatedColors[colorIndex].sizes[sizeIndex].product_stock = parseInt(
                      e.target.value,
                      10
                    );
                    setNewProduct({ ...newProduct, colors: updatedColors });
                  }}
                  className="PM_input"
                  placeholder="Product Stock"
                />
                <button
                  onClick={() => handleRemoveSize(colorIndex, sizeIndex)}
                  className="PM_button PM_button_remove"
                  disabled={color.sizes.length === 1}
                >
                  Remove Size
                </button>
              </div>
            ))}
            <div>
              <button
                onClick={() => handleAddSize(colorIndex)}
                className="PM_button PM_button_add_size"
              >
                Add Size
              </button>
              <button
                onClick={() => handleRemoveColor(colorIndex)}
                className="PM_button PM_button_remove"
                disabled={newProduct.colors.length === 1}
              >
                Remove Color
              </button>
            </div>
          </div>
        ))}

        <button onClick={handleAddColor} className="PM_button PM_button_add_color">
          Add Color
        </button>
        <div className="PM_button_right">
          <button onClick={createProduct} className="PM_button PM_button_create_product">
            Create Product
          </button>
        </div>
      </section>
    </div>
  );
};

export default ProductManagement;
