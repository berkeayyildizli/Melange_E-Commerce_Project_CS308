import React, { useState } from "react";
import { generateInvoicePDF } from "./pdfGenerator";

const SummaryStep = ({
  deliveryMethod,
  personalInfo,
  paymentMethod,
  shoppingBag = [],
}) => {
  const [orderId, setOrderId] = useState(null);
  const [pdfReady, setPdfReady] = useState(false); // State to indicate if the PDF is ready

  const handleFinishAndPay = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("User is not logged in.");
      return;
    }

    try {
      // Step 1: Call the /checkout API to process the order
      const response = await fetch("/checkout/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shoppingBag: shoppingBag.map((item) => ({
            productId: item.product_id,
            quantity: item.quantity,
          })),
          deliveryMethod,
          paymentMethod: {
            cardHolderName: paymentMethod.cardHolderName,
            cardNumber: paymentMethod.cardNumber.replace(/\s/g, ""),
            cardExpirationDate: paymentMethod.expirationDate,
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        console.log("Order processed successfully");

        // Step 2: Generate a random order ID for display
        const newOrderId = `ORD-${Math.floor(Math.random() * 1000000)}`;
        setOrderId(newOrderId);

        // Step 3: Mark the PDF as ready (but do not download or view yet)
        setPdfReady(true);

        // Step 4: Call the email API to send the invoice
        const emailResponse = await fetch("/checkout/send-email", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerEmail: personalInfo.email,
            orderId: newOrderId,
            shoppingBag: shoppingBag,
            personalInfo: personalInfo,
            deliveryMethod: deliveryMethod,
            paymentMethod: paymentMethod,
            totalPrice: totalPrice,

          }),
        });

        if (emailResponse.ok) {
          console.log("Invoice email sent successfully");
        } else {
          console.error("Failed to send invoice email");
        }
      } else {
        console.error("Error during checkout:", data.message);
      }
    } catch (error) {
      console.error("Error during checkout:", error);
    }
  };

  const deliveryFee = deliveryMethod === "special" ? 30.0 : 0.0;
  const subtotal = shoppingBag.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const totalPrice = subtotal + deliveryFee;

  const handleDownloadPDF = () => {
    if (!pdfReady) {
      console.warn("PDF is not ready yet.");
      return;
    }

    generateInvoicePDF({
      orderId,
      personalInfo,
      deliveryMethod,
      paymentMethod,
      shoppingBag,
      totalPrice,
      isForView: false, // Explicitly generate for download
    });
  };

  const handleViewPDF = () => {
    if (!pdfReady) {
      console.warn("PDF is not ready yet.");
      return;
    }

    generateInvoicePDF({
      orderId,
      personalInfo,
      deliveryMethod,
      paymentMethod,
      shoppingBag,
      totalPrice,
      isForView: true, // Enable "view mode" for PDF generation
    });
  };

  return (
    <div className="summary-step">
      {orderId ? (
        <div className="confirmation-page">
          <h2>🎉 Thank You! Your Order Was Successful 🎉</h2>
          <p>
            Your order ID is: <strong>{orderId}</strong>
          </p>
          <button
            className="pdf-button download"
            onClick={handleDownloadPDF}
            disabled={!pdfReady} // Disable button until PDF is ready
          >
            Download PDF Invoice
          </button>
          <button
            className="pdf-button view"
            onClick={handleViewPDF}
            disabled={!pdfReady} // Disable button until PDF is ready
          >
            View PDF Invoice
          </button>
        </div>
      ) : (
        <>
          <h2>Review Your Order</h2>

          {/* Delivery Method Section */}
          <section className="summary-section">
            <h3>Delivery Method</h3>
            <p>
              {deliveryMethod === "special"
                ? "Special Delivery (Extra charges apply)"
                : "Standard Delivery"}
            </p>
          </section>

          {/* Personal Information Section */}
          <section className="summary-section">
            <h3>Personal Information</h3>
            <p>
              <strong>Name:</strong> {personalInfo?.name || "Not Provided"}
            </p>
            <p>
              <strong>Surname:</strong> {personalInfo?.surname || "Not Provided"}
            </p>
            <p>
              <strong>Address:</strong> {personalInfo?.address || "Not Provided"}
            </p>
            <p>
              <strong>Email:</strong> {personalInfo?.email || "Not Provided"}
            </p>
          </section>

          {/* Payment Information Section */}
          <section className="summary-section">
            <h3>Payment Information</h3>
            {paymentMethod?.type === "credit" ? (
              <div>
                <p>
                  <strong>Payment Method:</strong> Credit Card
                </p>
                <p>
                  <strong>Card Number:</strong> **** **** ****{" "}
                  {paymentMethod.cardNumber?.slice(-4) || "Not Provided"}
                </p>
                <p>
                  <strong>Card Holder Name:</strong>{" "}
                  {paymentMethod.cardHolderName || "Not Provided"}
                </p>
              </div>
            ) : (
              <p>No Payment Information Provided</p>
            )}
          </section>

          {/* Order Summary Section */}
          <section className="summary-section">
            <h3>Order Summary</h3>
            <p>
              <strong>Subtotal:</strong> ${subtotal.toFixed(2)}
            </p>
            <p>
              <strong>Delivery Fee:</strong>{" "}
              {deliveryMethod === "special"
                ? "$30.00 (Special Delivery)"
                : "$0.00 (Standard Delivery)"}
            </p>
            <p>
              <strong>Total Price:</strong> ${totalPrice.toFixed(2)}
            </p>
          </section>

          <button className="finish-pay-button" onClick={handleFinishAndPay}>
            Finish & Pay
          </button>
        </>
      )}
    </div>
  );
};

export default SummaryStep;



