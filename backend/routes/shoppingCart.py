from flask_restx import Namespace, Resource, fields, reqparse
from flask import request, jsonify
from backend.models import db, ShoppingBagItem, ProductColors, ProductSizes, Products
from backend.utils import decode_jwt_token

# Namespace with Swagger Security Definitions
api = Namespace(
    'shoppingCart',
    description='Operations related to the shopping cart',
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
add_to_cart_model = api.model('AddToCart', {
    'base_product_id': fields.Integer(required=True, description='The ID of the base product'),
    'color_name': fields.String(required=True, description='The name of the product color'),
    'size_name': fields.String(required=True, description='The size of the product'),
    'shopping_quantity': fields.Integer(required=True, description='The quantity of the product to add')
})

view_cart_parser = api.parser()
view_cart_parser.add_argument('Authorization', location='headers', required=True, help='Bearer token is required')


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

    wrapper.__name__ = func.__name__  # Preserve original function name
    return wrapper


# POST /shopping-cart/add: Add product to cart
@api.route('/add')
class AddToCart(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(add_to_cart_model)
    @token_required
    def post(self):
        data = request.json
        customer_id = request.customer['customer_id']
        base_product_id = data.get('base_product_id')
        color_name = data.get('color_name')
        size_name = data.get('size_name')
        shopping_quantity = data.get('shopping_quantity')

        # Validate if the product color and size exist
        product_color = ProductColors.query.filter_by(base_product_id=base_product_id, color_name=color_name).first()
        if not product_color:
            return {"status": "failure", "message": "Invalid base product ID or color name"}, 400

        product_size = ProductSizes.query.filter_by(
            base_product_id=base_product_id, color_name=color_name, size_name=size_name
        ).first()
        if not product_size:
            return {"status": "failure", "message": "Invalid size for the given product and color"}, 400

        # Check if the item is already in the cart
        cart_item = ShoppingBagItem.query.filter_by(
            customer_id=customer_id, base_product_id=base_product_id, color_name=color_name, size_name=size_name
        ).first()
        if cart_item:
            # If item exists, update the quantity
            cart_item.product_quantity += shopping_quantity
            db.session.commit()
            return {"status": "success", "message": "Product quantity updated in cart"}
        else:
            # Add a new item to the cart
            new_cart_item = ShoppingBagItem(
                customer_id=customer_id,
                base_product_id=base_product_id,
                color_name=color_name,
                size_name=size_name,
                product_quantity=shopping_quantity,
            )
            db.session.add(new_cart_item)
            db.session.commit()
            return {"status": "success", "message": "Product added to cart"}


# GET /shopping-cart/view: View shopping cart
@api.route('/view')
class ViewCart(Resource):
    @api.doc(security='BearerAuth')
    @token_required
    def get(self):
        customer_id = request.customer['customer_id']
        cart_items = ShoppingBagItem.query.filter_by(customer_id=customer_id).all()

        if not cart_items:
            return {"status": "failure", "message": "No items in the shopping cart"}, 404

        cart_data = []
        for item in cart_items:
            product = Products.query.filter_by(base_product_id=item.base_product_id).first()
            if not product:
                continue

            color_info = ProductColors.query.filter_by(
                base_product_id=item.base_product_id,
                color_name=item.color_name
            ).first()

            size_info = ProductSizes.query.filter_by(
                base_product_id=item.base_product_id,
                color_name=item.color_name,
                size_name=item.size_name
            ).first()

            # --- RECALCULATE DISCOUNTED PRICE ON THE FLY ---
            original_price = float(product.price)
            discount_percent = float(product.discount_percentage or 0)
            discounted_price = original_price * (1 - discount_percent / 100.0)

            cart_data.append({
                "product_id": product.base_product_id,
                "product_name": product.product_name,
                "color_name": item.color_name,
                "size_name": item.size_name,
                "quantity": item.product_quantity,
                "price": round(discounted_price, 2),  # Return the discounted price
                "original_price": round(original_price, 2),
                "discount_percentage": discount_percent,
                "product_stock": int(size_info.product_stock) if size_info else 0,
                "image_url": f"/productImages/retrieve?base_product_id={item.base_product_id}&color_name={item.color_name}"
            })

        return jsonify({"status": "success", "cart_items": cart_data})


@api.route('/add-batch')
class AddBatchToCart(Resource):
    @api.doc(security='BearerAuth')
    @api.expect(api.model('BatchAddToCart', {
        'shoppingBag': fields.List(fields.Nested(api.model('CartItem', {
            'product_id': fields.Integer(required=True, description='Base product ID'),
            'product_name': fields.String(description='Product name'),  # Optional, not stored in DB
            'color_name': fields.String(required=True, description='Color name'),
            'size_name': fields.String(required=True, description='Size name'),
            'quantity': fields.Integer(required=True, description='Quantity to add'),
            'price': fields.Float(description='Price of the product'),  # Optional, not stored in DB
            'product_stock': fields.Integer(description='Available stock')  # Optional, validation only
        })))
    }))
    @token_required
    def post(self):
        customer_id = request.customer['customer_id']
        shopping_bag = request.json.get('shoppingBag', [])

        if not shopping_bag:
            return {"status": "failure", "message": "Shopping bag is empty"}, 400

        # Collect error messages for debugging
        errors = []
        success_count = 0

        for item in shopping_bag:
            try:
                base_product_id = item['product_id']
                color_name = item['color_name']
                size_name = item['size_name']
                quantity = item['quantity']

                # Validate foreign key constraints
                product_color = ProductColors.query.filter_by(
                    base_product_id=base_product_id, color_name=color_name
                ).first()
                if not product_color:
                    errors.append(f"Invalid color: {color_name} for product ID: {base_product_id}")
                    continue

                product_size = ProductSizes.query.filter_by(
                    base_product_id=base_product_id, color_name=color_name, size_name=size_name
                ).first()
                if not product_size:
                    errors.append(f"Invalid size: {size_name} for color: {color_name} and product ID: {base_product_id}")
                    continue

                # Check if the item already exists in the cart
                cart_item = ShoppingBagItem.query.filter_by(
                    customer_id=customer_id,
                    base_product_id=base_product_id,
                    color_name=color_name,
                    size_name=size_name
                ).first()

                if cart_item:
                    # Update the quantity
                    cart_item.product_quantity += quantity
                else:
                    # Add a new item to the cart
                    new_item = ShoppingBagItem(
                        customer_id=customer_id,
                        base_product_id=base_product_id,
                        color_name=color_name,
                        size_name=size_name,
                        product_quantity=quantity
                    )
                    db.session.add(new_item)

                success_count += 1

            except KeyError as e:
                errors.append(f"Missing required field: {str(e)} in item: {item}")
            except Exception as e:
                errors.append(f"Error processing item: {item}, {str(e)}")

        # Commit all valid changes to the database
        db.session.commit()

        # Return a detailed response
        return {
            "status": "success" if success_count > 0 else "failure",
            "message": f"{success_count} items added to the cart",
            "errors": errors
        }



# PUT /shopping-cart/update: Update the quantity of a product in the cart
@api.route('/update')
class UpdateCartItem(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(api.model('UpdateCartItem', {
        'base_product_id': fields.Integer(required=True, description='The ID of the base product'),
        'color_name': fields.String(required=True, description='The name of the product color'),
        'size_name': fields.String(required=True, description='The size of the product'),
        'shopping_quantity': fields.Integer(required=True, description='The new quantity of the product in the cart')
    }))
    @token_required
    def put(self):
        data = request.json
        customer_id = request.customer['customer_id']

        # Get item details from request
        base_product_id = data.get('base_product_id')
        color_name = data.get('color_name')
        size_name = data.get('size_name')
        shopping_quantity = data.get('shopping_quantity')

        # Validate if the product exists in the cart
        cart_item = ShoppingBagItem.query.filter_by(
            customer_id=customer_id,
            base_product_id=base_product_id,
            color_name=color_name,
            size_name=size_name
        ).first()

        if not cart_item:
            return {"status": "failure", "message": "Product not found in cart"}, 404

        # Validate if the quantity is positive
        if shopping_quantity <= 0:
            return {"status": "failure", "message": "Quantity must be greater than 0"}, 400

        # Update the quantity
        cart_item.product_quantity = shopping_quantity
        db.session.commit()

        return {"status": "success", "message": "Product quantity updated in cart"}


# DELETE /shopping-cart/remove: Remove product from cart
@api.route('/remove')
class RemoveFromCart(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(api.model('RemoveFromCartItem', {
        'base_product_id': fields.Integer(required=True, description='The ID of the base product'),
        'color_name': fields.String(required=True, description='The name of the product color'),
        'size_name': fields.String(required=True, description='The size of the product')
    }))
    @token_required
    def delete(self):
        data = request.json
        customer_id = request.customer['customer_id']

        # Get item details from request
        base_product_id = data.get('base_product_id')
        color_name = data.get('color_name')
        size_name = data.get('size_name')

        # Validate if the product exists in the cart
        cart_item = ShoppingBagItem.query.filter_by(
            customer_id=customer_id,
            base_product_id=base_product_id,
            color_name=color_name,
            size_name=size_name
        ).first()

        if not cart_item:
            return {"status": "failure", "message": "Product not found in cart"}, 404

        # Remove the item from the cart
        db.session.delete(cart_item)
        db.session.commit()

        return {"status": "success", "message": "Product removed from cart"}
