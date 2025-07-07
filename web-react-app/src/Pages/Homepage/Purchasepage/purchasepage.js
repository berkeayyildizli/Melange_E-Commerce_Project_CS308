import React, { useState } from 'react';
import './purchase.css';
import Navbar from '../MainPage/navbar';

const Purchase = () => {
  // States for form inputs (e.g., selected delivery method, payment type, coupon)
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [coupon, setCoupon] = useState('');
  const [shoppingBagItems, setShoppingBagItems] = useState([
    { id: 1, name: 'Item 1', price: 50, quantity: 2 },
    { id: 2, name: 'Item 2', price: 30, quantity: 1 },
    { id: 3, name: 'Item 3', price: 20, quantity: 3 }
  ]);

  // Calculating the total price of items in the shopping bag
  const totalPrice = shoppingBagItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleDeliveryChange = (e) => setDeliveryMethod(e.target.value);
  const handlePaymentChange = (e) => setPaymentMethod(e.target.value);
  const handleCouponChange = (e) => setCoupon(e.target.value);

  return (
    <div>
    <Navbar></Navbar>
    <div className="purchase-page">
      
      <div className="purchase-page__left">
        {/* Delivery Method */}
        <section className="purchase-page__section">
          <h2>Delivery Method</h2>
          <select value={deliveryMethod} onChange={handleDeliveryChange}>
            <option value="" disabled>Select delivery method</option>
            <option value="standard">Standard Delivery</option>
            <option value="express">Express Delivery</option>
            <option value="pickup">Pickup from Store</option>
          </select>
        </section>

        {/* Payment Method */}
        <section className="purchase-page__section">
          <h2>Payment Method</h2>
          <div>
            <label>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="debit" 
                checked={paymentMethod === 'debit'} 
                onChange={handlePaymentChange} 
              />
              Debit Card
            </label>
            <label>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="credit" 
                checked={paymentMethod === 'credit'} 
                onChange={handlePaymentChange} 
              />
              Credit Card
            </label>
            <label>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="coupon" 
                checked={paymentMethod === 'coupon'} 
                onChange={handlePaymentChange} 
              />
              Coupon
            </label>
          </div>
        </section>

        {/* Card */}
        {paymentMethod === 'credit' && (
          <section className="purchase-page__section">
            <h2>Credit Card</h2>
            <input 
              type="text" 
              placeholder="Enter card number" 
              value={coupon} 
              onChange={handleCouponChange} 
            />
          </section>
        )}

        {/* Coupon Code */}
        {paymentMethod === 'coupon' && (
          <section className="purchase-page__section">
            <h2>Coupon Code</h2>
            <input 
              type="text" 
              placeholder="Enter coupon code" 
              value={coupon} 
              onChange={handleCouponChange} 
            />
          </section>
        )}

        {/* Transaction Summary */}
        <section className="purchase-page__section">
          <h2>Transaction Summary</h2>
          <p>Items Total: ${totalPrice}</p>
          {paymentMethod === 'coupon' && <p>Coupon Applied: -$10 (Example discount)</p>}
          <p>Delivery: {deliveryMethod === 'express' ? '$5' : 'Free'}</p>
          <p>Total: ${paymentMethod === 'coupon' ? totalPrice - 10 : totalPrice}</p>
        </section>
      </div>

      <div className="purchase-page__right">
        {/* Shopping Bag Summary */}
        <h2>Shopping Bag</h2>
        <ul>
          {shoppingBagItems.map(item => (
            <li key={item.id} className="shopping-bag__item">
              <p>{item.name}</p>
              <p>Quantity: {item.quantity}</p>
              <p>Price: ${item.price * item.quantity}</p>
            </li>
          ))}
        </ul>
        <div className="shopping-bag__total">
          <h3>Total: ${totalPrice}</h3>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Purchase;
