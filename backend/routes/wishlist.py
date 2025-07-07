from flask_restx import Namespace, Resource, fields
from flask import request, jsonify
from backend.models import db, WishlistItem, ProductColors, ProductSizes, Products
from backend.utils import decode_jwt_token

# Namespace for Wishlist
wishlist_api = Namespace(
    'wishlist',
    description='Operations related to the wishlist',
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
add_to_wishlist_model = wishlist_api.model('AddToWishlist', {
    'base_product_id': fields.Integer(required=True, description='The ID of the base product'),
    'color_name': fields.String(required=True, description='The name of the product color'),
    'size_name': fields.String(required=True, description='The size of the product'),
    'addition_price': fields.Float(required=True, description='The additional price of the product'),
    'product_quantity': fields.Integer(required=False, default=1, description='The quantity of the product to add')
})

# Helper function to get customer ID from the JWT token
def token_required(func):
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return {"status": "failure", "message": "Token is missing"}, 401
        try:
            token = token.replace('Bearer ', '')
            decoded_token = decode_jwt_token(token)
            if not decoded_token:
                return {"status": "failure", "message": "Invalid or expired token"}, 401
            request.customer = decoded_token
        except Exception as e:
            return {"status": "failure", "message": str(e)}, 401
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

# POST /wishlist/add: Add product to wishlist
@wishlist_api.route('/add')
class AddToWishlist(Resource):
    @wishlist_api.doc(security='BearerAuth')
    @wishlist_api.expect(add_to_wishlist_model)
    @token_required
    def post(self):
        data = request.json
        customer_id = request.customer['customer_id']
        base_product_id = data.get('base_product_id')
        color_name = data.get('color_name')
        size_name = data.get('size_name')
        addition_price = data.get('addition_price')
        product_quantity = data.get('product_quantity', 1)

        try:
            # Check if the product color and size exist
            product_color = ProductColors.query.filter_by(base_product_id=base_product_id, color_name=color_name).first()
            if not product_color:
                return {"status": "failure", "message": "Invalid base product ID or color name"}, 400

            product_size = ProductSizes.query.filter_by(
                base_product_id=base_product_id, color_name=color_name, size_name=size_name
            ).first()
            if not product_size:
                return {"status": "failure", "message": "Invalid size for the given product and color"}, 400

            # Check if the item is already in the wishlist
            wishlist_item = WishlistItem.query.filter_by(
                customer_id=customer_id, base_product_id=base_product_id, color_name=color_name, size_name=size_name
            ).first()
            if wishlist_item:
                return {"status": "failure", "message": "Product already in wishlist"}, 400

            # Add a new item to the wishlist
            new_wishlist_item = WishlistItem(
                customer_id=customer_id,
                base_product_id=base_product_id,
                color_name=color_name,
                size_name=size_name,
                addition_price=addition_price,
                product_quantity=product_quantity,
            )
            db.session.add(new_wishlist_item)
            db.session.commit()
            return {"status": "success", "message": "Product added to wishlist"}, 201
        except Exception as e:
            db.session.rollback()
            return {"status": "failure", "message": str(e)}, 400

@wishlist_api.route('/view')
class ViewWishlist(Resource):
    @wishlist_api.doc(security='BearerAuth')
    @token_required
    def get(self):
        customer_id = request.customer['customer_id']
        try:
            wishlist_items = db.session.query(
                WishlistItem,
                Products,
                ProductColors
            ).join(
                Products, WishlistItem.base_product_id == Products.base_product_id
            ).join(
                ProductColors,
                (WishlistItem.base_product_id == ProductColors.base_product_id) &
                (WishlistItem.color_name == ProductColors.color_name)
            ).filter(
                WishlistItem.customer_id == customer_id
            ).all()

            if not wishlist_items:
                return {"status": "failure", "message": "No items in the wishlist"}, 404

            result = []
            for wishlist_item, product, product_color in wishlist_items:
                discount_percentage = float(product.discount_percentage or 0.0)
                discounted_price = float(product.price) * (1 - discount_percentage / 100.0)

                result.append({
                    "product_id": wishlist_item.base_product_id,
                    "product_name": product.product_name,
                    "color_name": wishlist_item.color_name,
                    "size_name": wishlist_item.size_name,
                    "addition_price": float(wishlist_item.addition_price),
                    "product_quantity": wishlist_item.product_quantity,
                    "product_price": float(product.price),
                    "discount_percentage": discount_percentage,
                    "discounted_price": round(discounted_price, 2),
                    "image_url": f"/productImages/retrieve?base_product_id={wishlist_item.base_product_id}&color_name={wishlist_item.color_name}",
                    "added_date": wishlist_item.wishlist_item_addition_date.isoformat()
                })

            return {"status": "success", "wishlist": result}, 200
        except Exception as e:
            return {"status": "failure", "message": str(e)}, 400
# DELETE /wishlist/remove: Remove product from wishlist
@wishlist_api.route('/remove')
class RemoveFromWishlist(Resource):
    @wishlist_api.doc(security='BearerAuth')
    @wishlist_api.expect(wishlist_api.model('RemoveFromWishlist', {
        'base_product_id': fields.Integer(required=True, description='The ID of the base product'),
        'color_name': fields.String(required=True, description='The name of the product color'),
        'size_name': fields.String(required=True, description='The size of the product')
    }))
    @token_required
    def delete(self):
        data = request.json
        customer_id = request.customer['customer_id']
        base_product_id = data.get('base_product_id')
        color_name = data.get('color_name')
        size_name = data.get('size_name')

        try:
            wishlist_item = WishlistItem.query.filter_by(
                customer_id=customer_id, base_product_id=base_product_id, color_name=color_name, size_name=size_name
            ).first()
            if not wishlist_item:
                return {"status": "failure", "message": "Product not found in wishlist"}, 404

            db.session.delete(wishlist_item)
            db.session.commit()
            return {"status": "success", "message": "Product removed from wishlist"}, 200
        except Exception as e:
            db.session.rollback()
            return {"status": "failure", "message": str(e)}, 400