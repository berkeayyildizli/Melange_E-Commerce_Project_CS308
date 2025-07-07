from fpdf import FPDF

def generate_invoice_pdf(order_id, personal_info, delivery_method, payment_method, shopping_bag, total_price, logo_path="logo.png", as_bytes=False):
    pdf = FPDF()
    pdf.add_page()

    # Header
    pdf.set_font("Arial", style="B", size=16)
    pdf.cell(200, 10, txt="Melangé Invoice", ln=True, align="C")
    pdf.ln(5)

    # Add Logo
    if logo_path:
        pdf.image(logo_path, x=90, y=25, w=30)  # Smaller logo with width 30mm, centered
        pdf.ln(35)  # Add vertical spacing to move content below the logo

    # Order ID
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt=f"Order ID: {order_id}", ln=True, align="C")
    pdf.ln(10)

    # Personal Information
    pdf.set_font("Arial", style="B", size=12)
    pdf.cell(0, 10, txt="Personal Information", ln=True, border="B")
    pdf.set_font("Arial", size=10)
    pdf.cell(0, 10, txt=f"Name: {personal_info['name']}", ln=True)
    pdf.cell(0, 10, txt=f"Surname: {personal_info['surname']}", ln=True)
    pdf.cell(0, 10, txt=f"Address: {personal_info['address']}", ln=True)
    pdf.cell(0, 10, txt=f"Email: {personal_info['email']}", ln=True)
    pdf.ln(10)

    # Delivery Method
    pdf.set_font("Arial", style="B", size=12)
    pdf.cell(0, 10, txt="Delivery Method", ln=True, border="B")
    pdf.set_font("Arial", size=10)
    pdf.cell(0, 10, txt=delivery_method.capitalize(), ln=True)
    pdf.ln(10)

    # Payment Information
    pdf.set_font("Arial", style="B", size=12)
    pdf.cell(0, 10, txt="Payment Information", ln=True, border="B")
    pdf.set_font("Arial", size=10)
    if payment_method.get("type") == "credit":
        pdf.cell(0, 10, txt=f"Card Holder: {payment_method['cardHolderName']}", ln=True)
        pdf.cell(0, 10, txt=f"Card Number: **** **** **** {payment_method['cardNumber'][-4:]}", ln=True)
    pdf.ln(10)

    # Shopping Bag (Table)
    pdf.set_font("Arial", style="B", size=12)
    pdf.cell(0, 10, txt="Shopping Bag", ln=True, border="B")
    pdf.set_font("Arial", size=10)

    # Table Header
    pdf.cell(80, 10, txt="Product Name", border=1, align="C")
    pdf.cell(30, 10, txt="Color", border=1, align="C")
    pdf.cell(20, 10, txt="Size", border=1, align="C")
    pdf.cell(30, 10, txt="Quantity", border=1, align="C")
    pdf.cell(30, 10, txt="Price", border=1, align="C")
    pdf.ln()

    # Table Rows
    for item in shopping_bag:
        pdf.cell(80, 10, txt=item["product_name"], border=1)
        pdf.cell(30, 10, txt=item["color_name"], border=1, align="C")
        pdf.cell(20, 10, txt=item["size_name"], border=1, align="C")
        pdf.cell(30, 10, txt=str(item["quantity"]), border=1, align="C")
        pdf.cell(30, 10, txt=f"${item['price']:.2f}", border=1, align="C")
        pdf.ln()

    # Total Price
    pdf.ln(10)
    pdf.set_font("Arial", style="B", size=12)
    pdf.cell(0, 10, txt=f"Total Price: ${total_price:.2f}", ln=True, align="R")

    # Save or Return as Bytes
    if as_bytes:
        return pdf.output(dest="S").encode("latin1")  # Return as raw bytes

    pdf.output("invoice.pdf")
