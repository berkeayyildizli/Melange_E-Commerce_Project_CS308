import React, { useState, useEffect } from "react";
import Navbar from "../MainPage/navbar";
import DeliveryStep from "./Steps/DeliveryStep";
import PersonalInfoStep from "./Steps/PersonalInfoStep";
import PaymentMethodStep from "./Steps/PaymentMethodStep";
import SummaryStep from "./Steps/SummaryStep";
import { loadShoppingBag } from "../MainPage/utilities"; // Import utility function

import "./checkout.css";

const CheckoutPage = () => {
  const [currentStep, setCurrentStep] = useState(1); // Tracks the current step
  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    surname: "",
    address: "",
    email: "",
  });
  const [paymentMethod, setPaymentMethod] = useState(null); // Holds payment info
  const [shoppingBag, setShoppingBag] = useState([]); // Holds shopping bag data
  const [subtotal, setSubtotal] = useState(0); // Tracks subtotal for shopping bag

  // Load shopping bag and calculate subtotal on component mount
  useEffect(() => {
    const fetchShoppingBag = async () => {
      const bagItems = await loadShoppingBag(); // Fetch shopping bag data
      setShoppingBag(bagItems);

      // Calculate subtotal
      const total = bagItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      setSubtotal(total);
    };

    fetchShoppingBag();
  }, []);

  const handleNextStep = () => setCurrentStep((prev) => prev + 1);
  const handlePreviousStep = () => setCurrentStep((prev) => prev - 1);

  const steps = [
    {
      label: "Delivery Method",
      component: (
        <DeliveryStep
          deliveryMethod={deliveryMethod}
          setDeliveryMethod={setDeliveryMethod}
          onNext={handleNextStep}
        />
      ),
    },
    {
      label: "Personal Info",
      component: (
        <PersonalInfoStep
          personalInfo={personalInfo}
          setPersonalInfo={setPersonalInfo}
          onNext={handleNextStep}
          onBack={handlePreviousStep}
        />
      ),
    },
    {
      label: "Payment Info",
      component: (
        <PaymentMethodStep
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          onNext={handleNextStep}
          onBack={handlePreviousStep}
        />
      ),
    },
    {
      label: "Summary",
      component: (
        <SummaryStep
          deliveryMethod={deliveryMethod}
          personalInfo={personalInfo}
          paymentMethod={paymentMethod}
          shoppingBag={shoppingBag}
          subtotal={subtotal}
          onBack={handlePreviousStep}
        />
      ),
    },
  ];

  return (
    <div>
      <Navbar />
      <div className="checkout-page">
        <div className="checkout-main">
          <div className="step-navigation">
            {steps.map((step, index) => (
              <span
                key={index}
                className={`step-title ${
                  index + 1 === currentStep ? "active" : ""
                } ${index + 1 <= currentStep ? "clickable" : "disabled"}`}
                onClick={() =>
                  index + 1 <= currentStep && setCurrentStep(index + 1)
                }
              >
                {step.label}
                {index < steps.length - 1 && <span className="arrow"> &gt; </span>}
              </span>
            ))}
          </div>

          <div className="step-content">{steps[currentStep - 1].component}</div>
        </div>

        <div className="checkout-shopping-bag">
          <h3>Order Summary</h3>
          {shoppingBag.length === 0 ? (
            <p>Shopping bag is empty.</p>
          ) : (
            <ul className="shopping-bag-list">
              {shoppingBag.map((item, index) => (
                <li key={index} className="shopping-bag-item">
                  <img
                    src={item.image_url} // Assumes the `image_url` is provided in the shopping bag data
                    alt={item.product_name}
                    className="shopping-bag-item-image"
                  />
                  <div className="shopping-bag-item-details">
                    <strong>{item.product_name}</strong> <br />
                    <span>{item.quantity} x {item.price.toFixed(2)} TL</span>
                  </div>
                </li>
              ))}
              <li className="shopping-bag-subtotal">
                <strong>Subtotal:</strong> {subtotal.toFixed(2)} TL
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;