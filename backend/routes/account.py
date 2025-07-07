from flask_restx import Namespace, Resource, fields, reqparse
from flask import request, jsonify
from backend.models import db, InvoiceItem, Customer
from backend.routes.adminMethods import token_parser
from backend.utils import decode_jwt_token
from collections import defaultdict
from sqlalchemy.sql import text

# Namespace for account-related operations
api = Namespace(
    'account',
    description='Operations related to user account and refunds',
    authorizations={
        'BearerAuth': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'Paste the JWT token here with "Bearer " prefix'
        }
    }
)

# Parser for Swagger documentation (to include Authorization header)
view_invoices_parser = api.parser()
view_invoices_parser.add_argument('Authorization', location='headers', required=True, help='Bearer token is required')

refund_item_parser = api.parser()
refund_item_parser.add_argument('Authorization', location='headers', required=True, help='Bearer token is required')

# Models for Swagger documentation
refund_item_model = api.model('RefundItem', {
    'invoice_item_id': fields.Integer(required=True, description='The ID of the invoice item to be refunded')
})


# Decorator to check for a valid JWT token
def token_required(func):
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return {"status": "failure", "message": "Token is missing"}, 401
        try:
            # Remove 'Bearer ' prefix if present
            token = token.replace('Bearer ', '')
            decoded_token = decode_jwt_token(token)
            if not decoded_token:
                return {"status": "failure", "message": "Invalid or expired token"}, 401
            # Pass the decoded token to the route function
            request.customer = decoded_token
        except Exception as e:
            return {"status": "failure", "message": str(e)}, 401
        return func(*args, **kwargs)

    wrapper.__name__ = func.__name__  # Preserve the original function name
    return wrapper


# GET /account/invoices: View user invoice items
@api.route('/invoices')
class ViewInvoices(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(view_invoices_parser)
    @token_required
    def get(self):
        customer_id = request.customer['customer_id']

        # Query the database to get all invoice items for the customer
        invoice_items = InvoiceItem.query.filter_by(customer_id=customer_id).all()
        if not invoice_items:
            return {"status": "failure", "message": "No invoice items found"}, 404

        # Group items by 'purchased_date' truncated to minute precision
        grouped_items = defaultdict(list)
        for item in invoice_items:
            # Normalize `purchased_date` to minute precision (truncate seconds and microseconds)
            purchase_time_key = item.purchased_date.replace(second=0, microsecond=0)
            grouped_items[purchase_time_key].append({
                "invoice_item_id": item.invoice_item_id,
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
        for purchase_time, items in grouped_items.items():
            response_data.append({
                "purchase_time": purchase_time.strftime("%B %d, %Y, %I:%M %p"),  # Format to year-month-day hour:minute
                "items": items
            })

        return jsonify({"status": "success", "orders": response_data})


# GET /account/invoices: View user invoice items
@api.route('/myrefunds')
class ViewInvoices(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(view_invoices_parser)
    @token_required
    def get(self):
        customer_id = request.customer['customer_id']

        # Query the database to get all invoice items for the customer
        invoice_items = InvoiceItem.query.filter(
            InvoiceItem.customer_id == customer_id,
            InvoiceItem.delivery_status.in_([5, 6, 7])
        ).all()
        if not invoice_items:
            return {"status": "failure", "message": "No invoice items found"}, 404

        # Group items by 'purchased_date' truncated to minute precision
        grouped_items = defaultdict(list)
        for item in invoice_items:
            # Normalize `purchased_date` to minute precision (truncate seconds and microseconds)
            purchase_time_key = item.purchased_date.replace(second=0, microsecond=0)
            grouped_items[purchase_time_key].append({
                "invoice_item_id": item.invoice_item_id,
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
        for purchase_time, items in grouped_items.items():
            response_data.append({
                "purchase_time": purchase_time.strftime("%Y-%m-%dT%H:%M"),  # Format to year-month-day hour:minute
                "items": items
            })

        return jsonify({"status": "success", "orders": response_data})


from datetime import datetime, timedelta

# POST /account/refund: Request a refund for an item
from datetime import datetime, timedelta, timezone

# POST /account/refund: Request a refund for an item
@api.route('/refund')
class RefundRequest(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(refund_item_model, refund_item_parser)
    @token_required
    def post(self):
        data = request.json
        customer_id = request.customer['customer_id']
        invoice_item_id = data.get('invoice_item_id')

        # Check if the invoice item exists and belongs to the customer
        invoice_item = InvoiceItem.query.filter_by(invoice_item_id=invoice_item_id, customer_id=customer_id).first()
        if not invoice_item:
            return {"status": "failure", "message": "Invoice item not found or unauthorized"}, 404

        # Check if the delivery status is 4 (completed delivery)
        if invoice_item.delivery_status != 4:
            return {
                "status": "failure",
                "message": "Refund not allowed. Delivery must be completed (status = 4)."
            }, 400

        # Check if the purchase was made within the last 30 days
        current_date = datetime.now(timezone.utc)  # Make current date timezone-aware
        purchase_date = invoice_item.purchased_date

        if not purchase_date or (current_date - purchase_date).days > 30:
            return {
                "status": "failure",
                "message": "Refund not allowed. Purchases older than 30 days are not eligible for a refund."
            }, 400

        # Update the status to reflect the refund request (e.g., 5 for "refund requested")
        invoice_item.delivery_status = 5  # Set to refund requested
        db.session.commit()

        return {
            "status": "success",
            "message": "Refund request submitted successfully",
            "invoice_item_id": invoice_item_id
        }, 200

@api.route('/user')
class UserDetails(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(view_invoices_parser)
    @token_required
    def get(self):
        customer_id = request.customer['customer_id']

        # Query the database to get the customer details
        customer = Customer.query.filter_by(customer_id=customer_id).first()
        if not customer:
            return {"status": "failure", "message": "User not found"}, 404

        # Return the customer's details
        return jsonify({
            "status": "success",
            "user": {
                "name": customer.name,
                "surname": customer.surname,
                "email": customer.email_address,
                "home_address": customer.home_address,
                "tax_id": customer.tax_id
            }
        })

from flask_restx import fields

# Define the input model for Swagger
cancel_order_model = api.model('CancelOrder', {
    'invoice_item_id': fields.Integer(
        required=True,
        description='The ID of the invoice item to cancel'
    )
})

@api.route('/cancelOrder')
class CancelOrder(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(token_parser, cancel_order_model)  # Expect both token and invoice_item_id
    @token_required
    def post(self):
        """
        Cancel all orders in the same purchase group based on the provided invoice item ID.
        Only cancels orders with delivery status 0 or 1, sets status to 8, and updates stock for the cancelled items.
        """
        data = request.json
        customer_id = request.customer['customer_id']
        invoice_item_id = data.get('invoice_item_id')

        if not invoice_item_id:
            return {"status": "failure", "message": "Invoice item ID is required"}, 400

        try:
            # Query the specific order to get its purchase time
            order_to_cancel = InvoiceItem.query.filter_by(
                customer_id=customer_id,
                invoice_item_id=invoice_item_id
            ).first()

            if not order_to_cancel:
                return {"status": "failure", "message": "Order not found"}, 404

            purchase_time = order_to_cancel.purchased_date.replace(second=0, microsecond=0)

            # Query all orders with the same purchase time
            orders_to_cancel = InvoiceItem.query.filter_by(
                customer_id=customer_id
            ).filter(
                InvoiceItem.purchased_date >= purchase_time,
                InvoiceItem.purchased_date < purchase_time + timedelta(minutes=1),
                InvoiceItem.delivery_status.in_([0, 1])
            ).all()

            if not orders_to_cancel:
                return {"status": "failure", "message": "No cancellable orders found in the purchase group"}, 404

            # Cancel all orders and update stock
            for order in orders_to_cancel:
                order.delivery_status = 8  # Cancelled status

                # Update stock in Product_Sizes
                product_stock_query = text(
                    'SELECT product_stock FROM "Product_Sizes" WHERE base_product_id = :base_product_id AND color_name = :color_name AND size_name = :size_name FOR UPDATE'
                )
                product_stock_result = db.session.execute(
                    product_stock_query,
                    {
                        'base_product_id': order.base_product_id,
                        'color_name': order.color_name,
                        'size_name': order.size_name,
                    },
                ).fetchone()

                if product_stock_result:
                    updated_stock = product_stock_result[0] + order.product_quantity
                    db.session.execute(
                        text(
                            'UPDATE "Product_Sizes" SET product_stock = :updated_stock WHERE base_product_id = :base_product_id AND color_name = :color_name AND size_name = :size_name'
                        ),
                        {
                            'updated_stock': updated_stock,
                            'base_product_id': order.base_product_id,
                            'color_name': order.color_name,
                            'size_name': order.size_name,
                        },
                    )
                else:
                    db.session.rollback()
                    return {
                        "status": "failure",
                        "message": f"Stock update failed for: Base Product ID {order.base_product_id}, Color {order.color_name}, Size {order.size_name}",
                    }, 404

            db.session.commit()

            return {
                "status": "success",
                "message": f"All orders in the purchase group starting at {purchase_time} have been cancelled and stock updated",
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"status": "failure", "message": f"An error occurred while cancelling the orders: {str(e)}"}, 500
