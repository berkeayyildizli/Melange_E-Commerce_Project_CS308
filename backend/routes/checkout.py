from flask_restx import Namespace, Resource, fields, reqparse
from flask import request, jsonify
from backend.models import db, Customer, CreditCard, ShoppingBagItem, InvoiceItem, Products, ProductColors, ProductSizes
from backend.pdf_generator import generate_invoice_pdf
from backend.sendMail import send_invoice_email
from backend.utils import decode_jwt_token

# Namespace for Checkout functionality
api = Namespace(
    'checkout',
    description='Operations related to the checkout process',
    authorizations={
        'BearerAuth': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'Paste the JWT token here with "Bearer " prefix'
        }
    }
)

# Models for Swagger documentation
credit_card_model = api.model('CreditCard', {
    'card_holder_name': fields.String(required=True, description='Name on the credit card'),
    'card_number': fields.String(required=True, description='Credit card number'),
    'card_expiration_date': fields.String(required=True, description='Credit card expiration date'),
    'save_card': fields.Boolean(description='Flag to save the card for future use')
})

# Decorator to validate JWT token
def token_required(func):
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return {"status": "failure", "message": "Token is missing"}, 401
        try:
            token = token.replace('Bearer ', '')  # Remove 'Bearer' prefix
            decoded_token = decode_jwt_token(token)
            if not decoded_token:
                return {"status": "failure", "message": "Invalid or expired token"}, 401
            request.customer_id = decoded_token.get('customer_id')  # Add customer ID to request
        except Exception as e:
            return {"status": "failure", "message": str(e)}, 401
        return func(*args, **kwargs)

    wrapper.__name__ = func.__name__
    return wrapper

# GET /checkout/user-info: Fetch user's personal information
@api.route('/user-info')
class UserInfo(Resource):
    @api.doc(security='BearerAuth')
    @token_required
    def get(self):
        """Fetch logged-in user's personal information"""
        customer_id = request.customer_id
        user = Customer.query.filter_by(customer_id=customer_id).first()  # Corrected field name

        if not user:
            return {"status": "failure", "message": "User not found"}, 404

        return {
            "status": "success",
            "user_info": {
                "name": user.name,
                "surname": user.surname,
                "address": user.home_address,  # Assuming this is the correct field for the address
                "email": user.email_address,  # Corrected field name for email
            }
        }

# POST /checkout/saveCard: Save credit card info
@api.route('/saveCard')
class SaveCard(Resource):
    @api.doc(security='BearerAuth')
    @api.expect(credit_card_model)
    @token_required
    def post(self):
        """Save credit card information"""
        customer_id = request.customer_id
        data = request.json

        card_holder_name = data.get('card_holder_name')
        card_number = data.get('card_number')
        card_expiration_date = data.get('card_expiration_date')
        save_card = data.get('save_card', False)

        if not card_holder_name or not card_number or not card_expiration_date:
            return {"status": "failure", "message": "Incomplete credit card information"}, 400

        # Save credit card info if save_card is true
        if save_card:
            # Check if the card is already saved for the user (based on card number and customer ID)
            existing_card = CreditCard.query.filter_by(
                customer_id=customer_id, card_number=card_number
            ).first()

            if existing_card:
                return {"status": "failure", "message": "Credit card already saved"}, 400

            # Save the new card
            new_card = CreditCard(
                customer_id=customer_id,
                card_holder_name=card_holder_name,
                card_number=card_number,
                card_expiration_date=card_expiration_date
            )
            db.session.add(new_card)
            db.session.commit()

        return {"status": "success", "message": "Credit card saved successfully"}

# POST /checkout/checkout: Process checkout
@api.route('/checkout')
class Checkout(Resource):
    @api.doc(security='BearerAuth')
    @token_required
    def post(self):
        """Process checkout for items in the shopping bag"""
        customer_id = request.customer_id

        # Fetch all items in the shopping bag for the customer
        cart_items = ShoppingBagItem.query.filter_by(customer_id=customer_id).all()
        if not cart_items:
            return {"status": "failure", "message": "No items in the shopping bag"}, 404

        for item in cart_items:
            # Fetch product details
            product = Products.query.filter_by(base_product_id=item.base_product_id).first()
            if not product:
                return {
                    "status": "failure",
                    "message": f"Product not found for item with base_product_id: {item.base_product_id}"
                }, 400

            # Fetch color details
            color = ProductColors.query.filter_by(
                base_product_id=item.base_product_id,
                color_name=item.color_name
            ).first()
            if not color:
                return {
                    "status": "failure",
                    "message": f"Color {item.color_name} not found for product {product.product_name}"
                }, 400

            # Fetch size and stock details
            size = ProductSizes.query.filter_by(
                base_product_id=item.base_product_id,
                color_name=item.color_name,
                size_name=item.size_name
            ).first()
            if not size:
                return {
                    "status": "failure",
                    "message": f"Size {item.size_name} not found for product {product.product_name} with color {color.color_name}"
                }, 400

            # Check stock availability
            if size.product_stock < item.product_quantity:
                return {
                    "status": "failure", #TODO: Asks for wishlist
                    "message": f"Insufficient stock for {product.product_name} (Color: {color.color_name}, Size: {size.size_name})"
                }, 400

            # Deduct stock
            size.product_stock -= item.product_quantity
            # In your /checkout/checkout POST method, after fetching `product`
            original_price = float(product.price)
            discount_percentage = float(product.discount_percentage or 0)
            discounted_price = original_price * (1 - discount_percentage / 100.0)

            invoice_item = InvoiceItem(
                customer_id=customer_id,
                price_at_purchase=discounted_price,  # use the discounted price
                product_quantity=item.product_quantity,
                base_product_id=item.base_product_id,
                color_name=item.color_name,
                size_name=item.size_name,
                delivery_status=0,
            )
            db.session.add(invoice_item)

        # Commit changes to deduct stock and add invoice items
        db.session.commit()

        # Clear the shopping bag
        ShoppingBagItem.query.filter_by(customer_id=customer_id).delete()
        db.session.commit()

        return {"status": "success", "message": "Checkout completed successfully"}

# POST /checkout/send-email: Send invoice email
@api.route('/send-email')
class SendEmail(Resource):
    @token_required
    def post(self):
        """API to send the invoice email with PDF attachment to the customer"""
        data = request.json
        customer_email = data.get("customerEmail")
        order_id = data.get("orderId")
        shopping_bag = data.get("shoppingBag", [])
        personal_info = data.get("personalInfo")
        delivery_method = data.get("deliveryMethod")
        payment_method = data.get("paymentMethod")
        total_price = data.get("totalPrice")

        print("data:", data)
        if not all([customer_email, order_id, personal_info]):
            return {"status": "failure", "message": "Missing required fields"}, 400

        try:
            pdf_data = generate_invoice_pdf(
                order_id=order_id,
                personal_info=personal_info,
                delivery_method=delivery_method,
                payment_method=payment_method,
                shopping_bag=shopping_bag,
                total_price=total_price,
                as_bytes=True
            )

            send_invoice_email(
                customer_email=customer_email,
                pdf_data=pdf_data,
                order_id=order_id,
                sender_email="SENDER_EMAIL",
                sender_password="SENDER_PASSWORD"
            )

            return {"status": "success", "message": "Invoice email sent successfully"}, 200

        except Exception as e:
            print(f"Error sending email: {e}")
            return {"status": "failure", "message": str(e)}, 500