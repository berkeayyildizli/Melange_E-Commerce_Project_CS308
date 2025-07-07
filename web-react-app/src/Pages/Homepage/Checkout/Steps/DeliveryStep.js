import React from "react";

const DeliveryStep = ({ deliveryMethod, setDeliveryMethod, onNext }) => {
  return (
    <div className="checkout-step">
      <h2>Choose Delivery Method</h2>
      <div className="delivery-options">
        <label>
          <input
            type="radio"
            value="standard"
            checked={deliveryMethod === "standard"}
            onChange={() => setDeliveryMethod("standard")}
          />
          Standard Delivery (Free)
        </label>
        <label>
          <input
            type="radio"
            value="special"
            checked={deliveryMethod === "special"}
            onChange={() => setDeliveryMethod("special")}
          />
          Special Delivery ($30)
        </label>
      </div>
      <div className="step-buttons">
        <button
          onClick={onNext}
          disabled={!deliveryMethod}
          className="next-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DeliveryStep;