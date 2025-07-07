import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

from backend.models import db, WishlistItem, Products, Customer


def send_invoice_email(customer_email, pdf_data, order_id, sender_email, sender_password):
    try:
        smtp_server = "smtp.gmail.com"
        smtp_port = 465

        subject = f"Invoice for Order {order_id}"
        body = f"""Dear Customer,

Thank you for your order. Please find attached the invoice for your order ID: {order_id}.

Best regards,
Melangé Team
"""

        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = customer_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))

        attachment = MIMEApplication(pdf_data, _subtype="pdf")
        attachment.add_header(
            "Content-Disposition", f'attachment; filename="Invoice_{order_id}.pdf"'
        )
        message.attach(attachment)

        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, customer_email, message.as_string())

        print(f"Invoice email sent successfully to {customer_email}")

    except Exception as e:
        print(f"Failed to send email: {e}")

def send_refund_email(customer_email, subject, body, sender_email, sender_password):
    try:
        smtp_server = "smtp.gmail.com"
        smtp_port = 465

        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = customer_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))

        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, customer_email, message.as_string())

        print(f"Refund email sent successfully to {customer_email}")

    except Exception as e:
        print(f"Failed to send email: {e}")


def send_price_drop_email(customer_email, product_name, wishlist_price, current_price, sender_email, sender_password):
    """
    Send an email notification about a price drop for a product on the wishlist.
    """
    try:
        smtp_server = "smtp.gmail.com"
        smtp_port = 465

        subject = f"Good News! Price Drop Alert for {product_name}"
        body = f"""Dear Valued Customer,

We have some exciting news for you! The price of one of your wishlist items, "{product_name}," has dropped.

Wishlist Price: ${wishlist_price:.2f}  
Current Price: ${current_price:.2f}  

Don't miss this opportunity to grab the product at a lower price. Check it out on our website now!

Best regards,  
The Melangé Team
"""

        # Create the email message
        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = customer_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))

        # Send the email
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, customer_email, message.as_string())

        print(f"Price drop email sent successfully to {customer_email}")

    except Exception as e:
        print(f"Failed to send email: {e}")



def check_price_drops_and_notify(sender_email, sender_password):
    """
    Check for price drops in the wishlist and notify users via email.

    Args:
        sender_email (str): The email address used to send notifications.
        sender_password (str): The password for the sender email.
    """
    try:
        # Query all wishlist items and join with product and customer data
        wishlist_items = db.session.query(
            WishlistItem, Products, Customer
        ).join(
            Products, WishlistItem.base_product_id == Products.base_product_id
        ).join(
            Customer, WishlistItem.customer_id == Customer.customer_id
        ).all()

        for wishlist_item, product, customer in wishlist_items:
            # Compare current product price with the wishlist price
            if product.price < wishlist_item.addition_price:
                # Send a price drop email notification
                send_price_drop_email(
                    customer_email=customer.email_address,  # Customer's email
                    product_name=product.product_name,  # Product name
                    wishlist_price=wishlist_item.addition_price,  # Old price (from WishlistItem)
                    current_price=product.price,  # New price (from Products)
                    sender_email=sender_email,  # Sender email
                    sender_password=sender_password  # Sender email password
                )

        print("Price drop check completed successfully.")

    except Exception as e:
        print(f"Error during price drop check: {e}")

