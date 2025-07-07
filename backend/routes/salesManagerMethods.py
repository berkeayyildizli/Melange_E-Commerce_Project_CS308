import io
import zipfile
from collections import defaultdict
from flask_restx import Namespace, Resource, reqparse
from flask import request, jsonify, send_file
from backend.models import db, Products, InvoiceItem, Customer, WishlistItem
from backend.config import Config
import jwt
from backend.pdf_generator import generate_invoice_pdf
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


api = Namespace(
    'salesManagerMethods',
    description='Methods for sales manager operations',
    authorizations={
        'BearerAuth': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'JWT token with "Bearer " prefix'
        }
    }
)

# Helper function to validate JWT token and role
def token_required_with_role(required_role):
    def decorator(func):
        def wrapper(*args, **kwargs):
            token = request.headers.get('Authorization')
            if not token:
                return {"status": "failure", "message": "Token is missing"}, 401
            try:
                if token.startswith("Bearer "):
                    token = token.split(" ")[1]
                payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
                if payload.get('role') != required_role:
                    return {"status": "failure", "message": "Unauthorized role"}, 403
            except jwt.ExpiredSignatureError:
                return {"status": "failure", "message": "Token has expired"}, 401
            except jwt.InvalidTokenError:
                return {"status": "failure", "message": "Invalid token"}, 401
            return func(*args, **kwargs)
        wrapper.__name__ = func.__name__
        return wrapper
    return decorator

# Define parsers for price and discount updates
price_parser = reqparse.RequestParser()
price_parser.add_argument('base_product_id', type=int, required=True, help="ID of the product to update")
price_parser.add_argument('new_price', type=float, required=True, help="New price of the product")

discount_parser = reqparse.RequestParser()
discount_parser.add_argument('base_product_id', type=int, required=True, help="ID of the product to update")
discount_parser.add_argument('new_discount', type=float, required=True, help="New discount percentage (0-100)")

# Route for updating product price
@api.route('/update-price')
class UpdatePrice(Resource):
    @api.doc(security='BearerAuth')
    @api.expect(price_parser)
    @token_required_with_role('salesManager')
    def post(self):
        """
        Update the price of a product (Sales Manager only)
        """
        args = price_parser.parse_args()
        base_product_id = args['base_product_id']
        new_price = args['new_price']

        # Find the product
        product = Products.query.filter_by(base_product_id=base_product_id).first()

        if not product:
            return {"status": "failure", "message": "Product not found"}, 404

        # Update the price
        product.price = new_price
        db.session.commit()

        return {"status": "success", "message": "Product price updated successfully", "product_id": base_product_id, "new_price": new_price}

@api.route('/update-discount')
class UpdateDiscount(Resource):
    @api.doc(security='BearerAuth')
    @api.expect(discount_parser)
    @token_required_with_role('salesManager')
    def post(self):
        """
        Update the discount percentage of a product (Sales Manager only)
        """
        args = discount_parser.parse_args()
        base_product_id = args['base_product_id']
        new_discount = args['new_discount']

        if new_discount < 0 or new_discount > 100:
            return {"status": "failure", "message": "Discount percentage must be between 0 and 100"}, 400

        # Find the product
        product = Products.query.filter_by(base_product_id=base_product_id).first()

        if not product:
            return {"status": "failure", "message": "Product not found"}, 404

        # Update the discount percentage
        product.discount_percentage = new_discount
        db.session.commit()

        # Add this line here if the update completes successfully
        success_message = {
            "status": "success",
            "message": "Product discount updated successfully",
            "product_id": base_product_id,
            "new_discount": new_discount
        }

        # Calculate the new discounted price
        discounted_price = float(product.price) * (1 - float(new_discount) / 100)

        try:
            # Fetch wishlist items related to this product
            wishlist_items = WishlistItem.query.filter_by(base_product_id=base_product_id).all()

            if not wishlist_items:
                return success_message  # No customers to notify, return success message

            # Notify customers with this product in their wishlist
            sender_email = "GMAIL_APP_PASSWORD"  # Replace with your sender email
            sender_password = "GMAIL_APP_PASSWORD"  # Replace with your sender password

            for item in wishlist_items:
                customer = Customer.query.filter_by(customer_id=item.customer_id).first()
                if customer:
                    # Send email notification
                    try:
                        smtp_server = "smtp.gmail.com"
                        smtp_port = 465

                        subject = f"Discount Alert: {product.product_name} Now at ${discounted_price:.2f}!"
                        body = f"""Dear {customer.name},

Good news! The product "{product.product_name}" in your wishlist is now available at a discounted price of ${discounted_price:.2f} (Discount: {new_discount}%).

Don't miss out! Check it out now.

Best regards,
Melangé Team
"""

                        message = MIMEMultipart()
                        message["From"] = sender_email
                        message["To"] = customer.email_address
                        message["Subject"] = subject
                        message.attach(MIMEText(body, "plain"))

                        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
                            server.login(sender_email, sender_password)
                            server.sendmail(sender_email, customer.email_address, message.as_string())

                        print(f"Discount email sent to {customer.email_address}")
                    except Exception as email_error:
                        print(f"Failed to send email to {customer.email_address}: {email_error}")

            # Return success message after all notifications
            return success_message

        except Exception as e:
            print(f"Error during discount update and notification: {e}")
            return {
                "status": "failure",
                "message": "Product discount updated, but error occurred while notifying customers",
                "error": str(e)
            }

# Swagger parser for filtering invoices by date
invoices_parser = reqparse.RequestParser()
invoices_parser.add_argument('start_date', type=str, required=False, help='Start date in YYYY-MM-DD format')
invoices_parser.add_argument('end_date', type=str, required=False, help='End date in YYYY-MM-DD format')

@api.route('/viewInvoices')
class ViewAllInvoices(Resource):
    @api.doc(security='BearerAuth')
    @api.expect(invoices_parser)
    @token_required_with_role('salesManager')  # Restrict access to Sales Managers
    def get(self):
        """View all invoices grouped by date and customer"""
        args = invoices_parser.parse_args()
        start_date = args.get('start_date')
        end_date = args.get('end_date')

        # Build the base query
        query = InvoiceItem.query

        # Filter by date range if provided
        if start_date:
            query = query.filter(InvoiceItem.purchased_date >= start_date)
        if end_date:
            query = query.filter(InvoiceItem.purchased_date <= end_date)

        # Fetch all invoice items
        invoice_items = query.all()
        if not invoice_items:
            return {"status": "failure", "message": "No invoices found in the specified date range"}, 404

        # Group items by (purchased_date truncated to minute precision) and customer_id
        grouped_items = defaultdict(list)
        for item in invoice_items:
            purchase_time_key = item.purchased_date.replace(second=0, microsecond=0)
            key = (purchase_time_key, item.customer_id)  # Group by date and customer ID
            customer = Customer.query.filter_by(customer_id=item.customer_id).first()
            grouped_items[key].append({
                "invoice_item_id": item.invoice_item_id,
                "customer_name": customer.name if customer else "Unknown",
                "customer_id": item.customer_id,
                "price_at_purchase": float(item.price_at_purchase),
                "product_quantity": item.product_quantity,
                "base_product_id": item.base_product_id,
                "color_name": item.color_name,
                "size_name": item.size_name,
                "purchased_date": item.purchased_date.isoformat(),
                "delivery_status": item.delivery_status
            })

        # Format the response
        response_data = []
        for (purchase_time, customer_id), items in grouped_items.items():
            response_data.append({
                "purchase_time": purchase_time.strftime("%Y-%m-%dT%H:%M"),  # Format to year-month-day hour:minute
                "customer_id": customer_id,
                "customer_name": items[0]["customer_name"] if items else "Unknown",  # Use the first item's customer name
                "items": items
            })

        return jsonify({"status": "success", "orders": response_data})


@api.route('/generateInvoicePDF/<string:purchase_time>/<int:customer_id>')
class GenerateInvoicePDF(Resource):
    @api.doc(security='BearerAuth')
    @token_required_with_role('salesManager')
    def get(self, purchase_time, customer_id):
        """Generate a PDF for a specific grouped purchase"""
        # Convert purchase_time back to datetime
        try:
            purchase_time = datetime.strptime(purchase_time, "%Y-%m-%dT%H:%M")
        except ValueError:
            return {"status": "failure", "message": "Invalid purchase time format"}, 400

        # Query all invoice items for the given purchase_time and customer_id
        invoice_items = InvoiceItem.query.filter(
            db.func.date_trunc('minute', InvoiceItem.purchased_date) == purchase_time,
            InvoiceItem.customer_id == customer_id
        ).all()

        if not invoice_items:
            return {"status": "failure", "message": "No invoices found for this group"}, 404

        # Get customer information
        customer = Customer.query.get(customer_id)
        if not customer:
            return {"status": "failure", "message": "Customer not found"}, 404

        # Prepare data for the PDF
        shopping_bag = []
        for item in invoice_items:
            product = Products.query.get(item.base_product_id)
            shopping_bag.append({
                "product_name": product.product_name if product else "Unknown",
                "color_name": item.color_name or "N/A",
                "size_name": item.size_name or "N/A",
                "quantity": item.product_quantity,
                "price": float(item.price_at_purchase),
            })

        # Calculate total price
        total_price = sum(item.product_quantity * item.price_at_purchase for item in invoice_items)

        # Personal info
        personal_info = {
            "name": customer.name,
            "surname": customer.surname,
            "address": customer.home_address,
            "email": customer.email_address
        }

        # Generate the PDF
        pdf_bytes = generate_invoice_pdf(
            order_id=f"Group-{purchase_time.strftime('%Y%m%d%H%M')}",
            personal_info=personal_info,
            delivery_method="Standard Delivery",
            payment_method={"type": "credit", "cardHolderName": "N/A", "cardNumber": "0000"},
            shopping_bag=shopping_bag,
            total_price=total_price,
            as_bytes=True
        )

        # Send the PDF as a response
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"invoice_{purchase_time.strftime('%Y%m%d%H%M')}_customer_{customer_id}.pdf"
        )

@api.route('/revenueAnalysis')
class RevenueAnalysis(Resource):
    @api.doc(security='BearerAuth')
    @api.expect(invoices_parser)  # Use the same parser for start_date and end_date
    @token_required_with_role('salesManager')  # Restrict access to Sales Managers
    def get(self):
        """Calculate daily revenue and purchase count in a given time interval"""
        args = invoices_parser.parse_args()
        start_date = args.get('start_date')
        end_date = args.get('end_date')

        # Build the base query
        query = db.session.query(
            db.func.date(InvoiceItem.purchased_date).label('purchase_date'),
            db.func.sum(InvoiceItem.price_at_purchase * InvoiceItem.product_quantity).label('total_revenue'),
            db.func.count(InvoiceItem.invoice_item_id).label('purchase_count')
        )

        # Apply date filters if provided
        if start_date:
            query = query.filter(InvoiceItem.purchased_date >= start_date)
        if end_date:
            query = query.filter(InvoiceItem.purchased_date <= end_date)

        # Group by date
        query = query.group_by(db.func.date(InvoiceItem.purchased_date))
        query = query.order_by(db.func.date(InvoiceItem.purchased_date))  # Ensure results are sorted by date

        # Execute query
        results = query.all()

        # Prepare the response
        response_data = [
            {
                "date": result.purchase_date.strftime("%Y-%m-%d"),
                "total_revenue": float(result.total_revenue),
                "purchase_count": result.purchase_count
            }
            for result in results
        ]

        return {"status": "success", "data": response_data}, 200

