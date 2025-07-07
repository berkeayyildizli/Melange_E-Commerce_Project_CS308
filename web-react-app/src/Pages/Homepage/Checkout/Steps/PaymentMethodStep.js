import React, { useState } from "react";

const PaymentMethodStep = ({ setPaymentMethod, onNext, onBack }) => {
  const [creditCardDetails, setCreditCardDetails] = useState({
    cardHolderName: "",
    cardNumber: "",
    expirationDate: "",
    cvv: "",
  });

  // Format card number to have spaces after every 4 digits
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove all non-numeric characters
    value = value.match(/.{1,4}/g)?.join(" ") || value; // Add spaces every 4 digits
    setCreditCardDetails((prev) => ({ ...prev, cardNumber: value }));
  };

  // Format expiration date to MM/YY format
  const handleExpirationDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
    if (value.length > 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4); // Add slash after 2 digits
    }
    setCreditCardDetails((prev) => ({ ...prev, expirationDate: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCreditCardDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    // Pass credit card details to the parent state
    setPaymentMethod({ type: "credit", ...creditCardDetails });
    onNext();
  };

  return (
    <div className="checkout-step">
      <h2>Enter Payment Details</h2>
      <div className="credit-card-form">
        <input
          type="text"
          name="cardHolderName"
          placeholder="Card Holder Name"
          value={creditCardDetails.cardHolderName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="cardNumber"
          placeholder="Card Number"
          maxLength="19" // 16 digits + 3 spaces
          value={creditCardDetails.cardNumber}
          onChange={handleCardNumberChange}
          required
        />
        <input
          type="text"
          name="expirationDate"
          placeholder="Expiration Date (MM/YY)"
          maxLength="5" // MM/YY format
          value={creditCardDetails.expirationDate}
          onChange={handleExpirationDateChange}
          required
        />
        <input
          type="text"
          name="cvv"
          placeholder="CVV"
          maxLength="3" // 3 digits for CVV
          value={creditCardDetails.cvv}
          onChange={handleChange}
          required
        />
      </div>
      <div className="step-buttons">
        <button onClick={onBack} className="back-button">
          Back
        </button>
        <button
          onClick={handleNext}
          className="next-button"
          disabled={
            !creditCardDetails.cardHolderName ||
            !creditCardDetails.cardNumber.match(/^\d{4} \d{4} \d{4} \d{4}$/) || // Validate card number format
            !creditCardDetails.expirationDate.match(/^\d{2}\/\d{2}$/) || // Validate expiration date format
            !creditCardDetails.cvv.match(/^\d{3}$/) // Validate CVV format
          }
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaymentMethodStep;




