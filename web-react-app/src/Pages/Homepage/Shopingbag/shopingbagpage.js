import React, { useState, useEffect } from 'react';
import './ShoppingBagPage.css';
import { FaTimes } from 'react-icons/fa'; // Import the close icon
import { loadShoppingBag, removeItemFromBag, updateItemQuantity } from '../MainPage/utilities'; // Import utility functions
import { useNavigate } from 'react-router-dom';
import { verifyToken } from '../MainPage/utilities';

const ShoppingBagPage = ({ onClose }) => {
    const [shoppingBag, setShoppingBag] = useState([]);
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState(''); 

    // Load shopping bag from localStorage on initial render
    useEffect(() => {
        const fetchShoppingBag = async () => {
            const savedBag = await loadShoppingBag(); // Await the promise
            setShoppingBag(Array.isArray(savedBag) ? savedBag : []); // Ensure it's an array
            const event = new Event("shoppingBagUpdated");
            window.dispatchEvent(event);
        };

        fetchShoppingBag(); // Call the async function
    }, []);

    // Remove item from shopping bag
    const handleRemove = async (item) => {
        const updatedBag = await removeItemFromBag(shoppingBag, item); // Await the async function
        setShoppingBag(updatedBag); // Update the state with the resolved value
        const event = new Event("shoppingBagUpdated");
        window.dispatchEvent(event);
    };

    // Update quantity of an item
    const handleQuantityChange = async (item, newQuantity) => {
        const updatedBag = await updateItemQuantity(shoppingBag, item, newQuantity); // Await the async function
        setShoppingBag(updatedBag); // Update the state with the resolved value
        const event = new Event("shoppingBagUpdated");
        window.dispatchEvent(event);
    };

    // Proceed to checkout
    const handleCheckout = async () => {
        const { valid } = await verifyToken();
        if (valid) {
            navigate('/checkout');
            onClose(); // Close shopping bag only if the user is signed in
        } else {
            setErrorMessage('To checkout you need to login first.');
        }
    };

    return (
        <div className="shopping-bag-sidebar">
            <FaTimes className="shopping-bag-close-icon" onClick={onClose} /> {/* Close icon */}
            <h2 className="shopping-bag-title">Shopping Bag</h2>
            <ul className="shopping-bag-list">
                {shoppingBag.length === 0 ? (
                    <p className="shopping-bag-empty">Your shopping bag is empty.</p>
                ) : (
                    shoppingBag.map((item, index) => (
                        <li key={index} className="shopping-bag-item">
                            <div className="shopping-bag-details">
                                <img
                                    src={`/productImages/retrieve?base_product_id=${item.product_id}&color_name=${item.color_name}`}
                                    alt={`Product ${item.product_name}`}
                                    className="shopping-bag-image"
                                />
                                <div className="shopping-bag-info">
                                    <div>
                                        <p><strong>Name:</strong> {item.product_name}</p>
                                        <p><strong>{item.price} TL</strong></p>
                                    </div>
                                    <p><strong>Color:</strong> {item.color_name}</p>
                                    <p><strong>Size:</strong> {item.size_name}</p>
                                    <p><strong>Quantity:</strong>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            min="1"
                                            max={item.product_stock}
                                            onChange={(e) =>
                                                handleQuantityChange(item, Math.min(parseInt(e.target.value) || 1, item.product_stock))
                                            }
                                            className="shopping-bag-quantity-input"
                                        />
                                        <span className="shopping-bag-stock-info">
                                            (Stock: {item.product_stock})
                                        </span>
                                    </p>
                                    <button className="shopping-bag-remove-btn" onClick={() => handleRemove(item)}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))
                )}
            </ul>
            {errorMessage && (
            <div className="adminlogin-error">
              {errorMessage}
            </div>
            )}
            <button 
                onClick={handleCheckout} 
                disabled={shoppingBag.length === 0} 
                className="shopping-bag-checkout-btn"
            >
                Checkout
            </button>
        </div>
    );
};

export default ShoppingBagPage;
