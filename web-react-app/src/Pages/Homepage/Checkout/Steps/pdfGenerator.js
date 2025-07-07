import jsPDF from "jspdf";
import "jspdf-autotable";
import logo from "./logo.png";

export const generateInvoicePDF = ({
  orderId,
  personalInfo,
  deliveryMethod,
  paymentMethod,
  shoppingBag,
  totalPrice,
  isForView = false,
  asBytes = false,
}) => {
  const doc = new jsPDF();

  // Header
  doc.addImage(logo, "PNG", 85, 10, 40, 20); // Logo centered at the top
  doc.setFontSize(16);
  doc.text("Melangé Invoice", 105, 40, { align: "center" });
  doc.setFontSize(12);
  doc.text(`Order ID: ${orderId}`, 14, 50);

  // Personal Information
  doc.setFontSize(14);
  doc.text("Personal Information", 14, 60);
  doc.line(14, 62, 196, 62); // Horizontal line
  doc.setFontSize(12);
  doc.text(`Name: ${personalInfo.name || "N/A"}`, 14, 70);
  doc.text(`Surname: ${personalInfo.surname || "N/A"}`, 14, 80);
  doc.text(`Address: ${personalInfo.address || "N/A"}`, 14, 90);
  doc.text(`Email: ${personalInfo.email || "N/A"}`, 14, 100);

  // Delivery Method
  doc.setFontSize(14);
  doc.text("Delivery Method", 14, 110);
  doc.line(14, 112, 196, 112); // Horizontal line
  doc.setFontSize(12);
  const deliveryText =
    deliveryMethod === "special"
      ? "Special Delivery (Extra charges apply)"
      : "Standard Delivery";
  doc.text(deliveryText, 14, 120);

  // Payment Information
  doc.setFontSize(14);
  doc.text("Payment Information", 14, 130);
  doc.line(14, 132, 196, 132); // Horizontal line
  doc.setFontSize(12);
  if (paymentMethod?.type === "credit") {
    doc.text(`Card Holder: ${paymentMethod.cardHolderName || "N/A"}`, 14, 140);
    doc.text(
      `Card Number: **** **** **** ${paymentMethod.cardNumber.slice(-4)}`,
      14,
      150
    );
  } else {
    doc.text("No Payment Information Provided", 14, 140);
  }

  // Shopping Bag (Table)
  const tableRows = shoppingBag.map((item) => [
    item.product_name,
    item.color_name,
    item.size_name,
    item.quantity,
    `$${item.price.toFixed(2)}`,
  ]);

  doc.autoTable({
    head: [["Product Name", "Color", "Size", "Quantity", "Price"]],
    body: tableRows,
    startY: 160,
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
  });

  // Total Price
  const finalY = doc.autoTable.previous.finalY + 10;
  doc.setFontSize(14);
  doc.text(`Total Price: $${totalPrice.toFixed(2)}`, 14, finalY);

  // Output
  if (asBytes) {
    return doc.output("arraybuffer");
  } else if (isForView) {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  } else {
    doc.save(`Invoice_${orderId}.pdf`);
  }
};
