from flask_restx import Namespace, Resource, fields
from flask import request, jsonify
from backend.models import db, InvoiceItem, ProductComments, Customer, Products, Categories, ProductColors, ProductSizes
from backend.config import Config
import jwt

from backend.routes.bulkCreate import product_creation_model
from backend.sendMail import send_refund_email

# Namespace for admin methods
api = Namespace(
    'adminMethods',
    description='Admin methods for order and comment management',
    authorizations={
        'BearerAuth': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'JWT token with "Bearer " prefix'
        }
    }
)

# Swagger models
token_parser = api.parser()
token_parser.add_argument('Authorization', location='headers', required=True, help='Bearer token is required')

approve_order_model = api.model('ApproveOrder', {
    'invoice_item_id': fields.Integer(required=True, description='ID of the invoice item to approve')
})

change_status_model = api.model('ChangeStatus', {
    'invoice_item_id': fields.Integer(required=True, description='ID of the invoice item'),
    'new_status': fields.Integer(required=True, description='New status (0-4)')
})

approve_comment_model = api.model('ApproveComment', {
    'comment_id': fields.Integer(required=True, description='ID of the comment to approve')
})

pending_comments_model = api.model('PendingComments', {
    'comment_id': fields.Integer(description='Comment ID'),
    'customer_id': fields.Integer(description='Customer ID'),
    'product_id': fields.Integer(description='Product ID'),
    'comment_content': fields.String(description='Content of the comment'),
    'created_at': fields.DateTime(description='Creation date')
})

remove_product_category_model = api.model('RemoveProductCategory', {
    'category_id': fields.Integer(description='ID of the category to remove', required=False)

})

category_model = api.model('Category', {
    'category_name': fields.String(required=True, description='Name of the category'),
    'category_gender': fields.String(required=True, description='Gender for the category (e.g., Men, Women, Unisex)')
})
# Size Model for nested sizes inside colors
size_model = api.model('Size', {
    'size_name': fields.String(required=True, description='Size name of the product (e.g., S, M, L)'),
    'product_stock': fields.Integer(required=True, description='Stock quantity for this size')
})

# Color Model for nested colors inside products
color_model = api.model('Color', {
    'color_name': fields.String(required=True, description='Name of the color'),
    'product_image': fields.String(required=True, description='Image URL for the product color'),
    'color_description': fields.String(required=True, description='Description of the color'),
    'sizes': fields.List(fields.Nested(size_model), description='List of sizes associated with this color')
})

# Main Product Model
product_model = api.model('Product', {
    'category_id': fields.Integer(required=True, description='ID of the category to assign the product to'),
    'product_name': fields.String(required=True, description='Name of the product'),
    'model': fields.Integer(required=True, description='Model number of the product'),
    'serial_number': fields.Integer(required=True, description='Serial number of the product'),
    'price': fields.Float(required=True, description='Price of the product'),
    'warranty_status': fields.Integer(required=True, description='Warranty status of the product'),
    'distributor': fields.String(required=True, description='Distributor of the product'),
    'discount_percentage': fields.Float(required=False, description='Discount percentage', default=0.0),
    'colors': fields.List(fields.Nested(color_model), description='List of colors associated with the product')
})



# Helper function to check admin role
def token_required_with_role(*required_roles):
    def decorator(func):
        def wrapper(*args, **kwargs):
            token = request.headers.get('Authorization')
            if not token:
                return {"status": "failure", "message": "Token is missing"}, 401
            try:
                # Decode the JWT token
                if token.startswith("Bearer "):
                    token = token.split(" ")[1]
                payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
                user_role = payload.get('role')
                if user_role not in required_roles:
                    return {"status": "failure", "message": "Unauthorized role"}, 403
            except jwt.ExpiredSignatureError:
                return {"status": "failure", "message": "Token has expired"}, 401
            except jwt.InvalidTokenError:
                return {"status": "failure", "message": "Invalid token"}, 401
            return func(*args, **kwargs)
        wrapper.__name__ = func.__name__  # Preserve the original function name
        return wrapper
    return decorator



# Existing Approve Order Method
@api.route('/approveOrder')
class ApproveOrder(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(approve_order_model, token_parser)
    @token_required_with_role('productManager')
    def post(self):
        """Approve a specific order by invoice_item_id"""
        data = request.json
        invoice_item_id = data.get('invoice_item_id')

        if not invoice_item_id:
            return {"status": "failure", "message": "Invoice item ID is required"}, 400

        # Find the order with delivery_status = 0
        order = InvoiceItem.query.filter_by(invoice_item_id=invoice_item_id, delivery_status=0).first()

        if not order:
            return {"status": "failure", "message": "Order not found or already approved"}, 404

        # Approve the order by updating its delivery_status
        order.delivery_status = 1
        db.session.commit()

        return {"status": "success", "message": f"Order {invoice_item_id} has been approved"}, 200


# Existing Change Status Method
@api.route('/changeOrderStatus')
class ChangeStatus(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(change_status_model, token_parser)
    @token_required_with_role('productManager')
    def post(self):
        """Change the status of an order"""
        data = request.json
        invoice_item_id = data.get('invoice_item_id')
        new_status = data.get('new_status')

        if not invoice_item_id or new_status is None:
            return {"status": "failure", "message": "Invoice item ID and new status are required"}, 400

        if new_status not in [0, 1, 2, 3, 4]:
            return {"status": "failure", "message": "Invalid status. Valid statuses are 0, 1, 2, 3, 4"}, 400

        # Find the order
        order = InvoiceItem.query.filter_by(invoice_item_id=invoice_item_id).first()

        if not order:
            return {"status": "failure", "message": "Order not found"}, 404

        # Update the order status
        previous_status = order.delivery_status
        order.delivery_status = new_status
        db.session.commit()

        return {
            "status": "success",
            "message": f"Order {invoice_item_id} status changed from {previous_status} to {new_status}"
        }, 200


# New Method: View Pending Comments
@api.route('/pending-comments')
class PendingComments(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(token_parser)
    @token_required_with_role('productManager')
    def get(self):
        """Retrieve all comments pending approval (comment_status = 0), ordered by most recent"""
        comments = ProductComments.query.filter_by(comment_status=0).order_by(ProductComments.created_at.desc()).all()

        if not comments:
            return {"status": "failure", "message": "No pending comments found"}, 404

        # Format comments for response
        comments_list = [
            {
                "comment_id": comment.comment_id,
                "customer_id": comment.customer_id,
                "product_id": comment.product_id,
                "comment_content": comment.comment_content,
                "created_at": comment.created_at.isoformat()
            }
            for comment in comments
        ]

        return {"status": "success", "pending_comments": comments_list}, 200


# New Method: Approve Specific Comment
@api.route('/approveComment')
class ApproveComment(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(approve_comment_model, token_parser)
    @token_required_with_role('productManager')
    def post(self):
        """Approve a specific comment by comment_id"""
        data = request.json
        comment_id = data.get('comment_id')

        if not comment_id:
            return {"status": "failure", "message": "Comment ID is required"}, 400

        # Find the comment with comment_status = 0
        comment = ProductComments.query.filter_by(comment_id=comment_id, comment_status=0).first()

        if not comment:
            return {"status": "failure", "message": "Comment not found or already approved"}, 404

        # Approve the comment by updating its comment_status
        comment.comment_status = 1
        db.session.commit()

        return {"status": "success", "message": f"Comment {comment_id} has been approved"}, 200

# New Method: Approve Specific Comment
@api.route('/declineComment')
class ApproveComment(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(approve_comment_model, token_parser)
    @token_required_with_role('productManager')
    def post(self):
        """Approve a specific comment by comment_id"""
        data = request.json
        comment_id = data.get('comment_id')

        if not comment_id:
            return {"status": "failure", "message": "Comment ID is required"}, 400

        # Find the comment with comment_status = 0
        comment = ProductComments.query.filter_by(comment_id=comment_id).first()

        if not comment:
            return {"status": "failure", "message": "Comment not found or already approved"}, 404

        # Approve the comment by updating its comment_status
        comment.comment_status = 2
        db.session.commit()

        return {"status": "success", "message": f"Comment {comment_id} has been approved"}, 200


# New Method: View All Orders with Status 0
@api.route('/pendingOrders')
class PendingOrders(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(token_parser)
    @token_required_with_role('productManager')
    def get(self):
        """Retrieve all orders with delivery_status = 0, ordered by most recent"""
        orders = InvoiceItem.query.filter_by(delivery_status=0).order_by(InvoiceItem.purchased_date.desc()).all()

        if not orders:
            return {"status": "failure", "message": "No orders with delivery status 1, 2, or 3 found"}, 404

        # Format orders for response
        orders_list = []
        for order in orders:
            # Fetch the corresponding customer's home address
            customer = Customer.query.filter_by(customer_id=order.customer_id).first()
            if customer:
                home_address = customer.home_address
            else:
                home_address = "Address not available"  # Fallback in case customer record is missing

            orders_list.append({
                "invoice_item_id": order.invoice_item_id,
                "customer_id": order.customer_id,
                "price_at_purchase": float(order.price_at_purchase),
                "product_quantity": order.product_quantity,
                "base_product_id": order.base_product_id,
                "color_name": order.color_name,
                "size_name": order.size_name,
                "purchased_date": order.purchased_date.isoformat(),
                "delivery_status": order.delivery_status,
                "home_address": home_address  # Add the home address to the response
            })

        return {"status": "success", "pending_orders": orders_list}, 200


# New Method: Return Orders with Delivery Status 1, 2, or 3
@api.route('/returnOrderStatus')
class ReturnOrderStatus(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(token_parser)
    @token_required_with_role('productManager')
    def get(self):
        """Retrieve all orders with delivery_status = 1, 2, or 3, ordered by most recent"""
        # Fetch orders with delivery_status 1, 2, or 3
        orders = InvoiceItem.query.filter(InvoiceItem.delivery_status.in_([1, 2, 3])).order_by(
            InvoiceItem.purchased_date.desc()
        ).all()

        if not orders:
            return {"status": "failure", "message": "No orders with delivery status 1, 2, or 3 found"}, 404

        # Format orders for response
        orders_list = []
        for order in orders:
            # Fetch the corresponding customer's home address
            customer = Customer.query.filter_by(customer_id=order.customer_id).first()
            if customer:
                home_address = customer.home_address
            else:
                home_address = "Address not available"  # Fallback in case customer record is missing

            orders_list.append({
                "invoice_item_id": order.invoice_item_id,
                "customer_id": order.customer_id,
                "price_at_purchase": float(order.price_at_purchase),
                "product_quantity": order.product_quantity,
                "base_product_id": order.base_product_id,
                "color_name": order.color_name,
                "size_name": order.size_name,
                "purchased_date": order.purchased_date.isoformat(),
                "delivery_status": order.delivery_status,
                "home_address": home_address  # Add the home address to the response
            })

        return {"status": "success", "orders": orders_list}, 200


# New Method: View Pending Refunds
@api.route('/pendingRefunds')
class PendingRefunds(Resource):
    @api.doc(security='BearerAuth')
    @api.expect(token_parser)
    @token_required_with_role('salesManager')
    def get(self):
        """Retrieve all orders with delivery_status = 5 (pending refund), ordered by most recent"""
        refunds = InvoiceItem.query.filter_by(delivery_status=5).order_by(InvoiceItem.purchased_date.desc()).all()

        if not refunds:
            return {"status": "failure", "message": "No pending refunds found"}, 404

        refunds_list = []
        for refund in refunds:
            # Fetch the corresponding customer's home address
            customer = Customer.query.filter_by(customer_id=refund.customer_id).first()
            if customer:
                home_address = customer.home_address
            else:
                home_address = "Address not available"

            refunds_list.append({
                "invoice_item_id": refund.invoice_item_id,
                "customer_id": refund.customer_id,
                "price_at_purchase": float(refund.price_at_purchase),
                "product_quantity": refund.product_quantity,
                "base_product_id": refund.base_product_id,
                "color_name": refund.color_name,
                "size_name": refund.size_name,
                "purchased_date": refund.purchased_date.isoformat(),
                # NEW FIELD:
                "home_address": home_address
            })

        return {"status": "success", "pending_refunds": refunds_list}, 200


from sqlalchemy.sql import text

@api.route('/approveRefund')
class ApproveRefund(Resource):
 @api.doc(security='BearerAuth')  # Attach security to this method
 @api.expect(change_status_model, token_parser)
 @token_required_with_role('salesManager')
 def post(self):
     """
     Change refund status for an order.
     Status 6: Refund approved (restock item).
     Status 7: Refund denied.
     Sends an email to the customer if the refund is approved.
     """
     data = request.json
     invoice_item_id = data.get('invoice_item_id')
     new_status = data.get('new_status')

     if not invoice_item_id or new_status is None:
         return {"status": "failure", "message": "Invoice item ID and new status are required"}, 400

     if new_status not in [6, 7]:
         return {"status": "failure", "message": "Invalid status. Valid statuses are 6 (approved), 7 (denied)"}, 400

     # Find the refund request
     refund = InvoiceItem.query.filter_by(invoice_item_id=invoice_item_id, delivery_status=5).first()

     if not refund:
         return {"status": "failure", "message": "Refund request not found or already processed"}, 404

     # ----- If REFUND APPROVED -----
     if new_status == 6:
         # 1) Update stock
         product_stock_query = text(
             'SELECT product_stock FROM "Product_Sizes" '
             'WHERE base_product_id = :base_product_id '
             'AND color_name = :color_name AND size_name = :size_name FOR UPDATE'
         )
         product_stock_result = db.session.execute(
             product_stock_query,
             {
                 'base_product_id': refund.base_product_id,
                 'color_name': refund.color_name,
                 'size_name': refund.size_name,
             },
         ).fetchone()

         if product_stock_result:
             updated_stock = product_stock_result[0] + refund.product_quantity
             db.session.execute(
                 text(
                     'UPDATE "Product_Sizes" SET product_stock = :updated_stock '
                     'WHERE base_product_id = :base_product_id '
                     'AND color_name = :color_name AND size_name = :size_name'
                 ),
                 {
                     'updated_stock': updated_stock,
                     'base_product_id': refund.base_product_id,
                     'color_name': refund.color_name,
                     'size_name': refund.size_name,
                 },
             )
         else:
             return {"status": "failure", "message": "Product size not found for stock update"}, 404

         # 2) Send email notification
         customer = Customer.query.filter_by(customer_id=refund.customer_id).first()
         if customer:
             try:
                 # Compute the total refund amount
                 total_refund_amount = float(refund.price_at_purchase) * refund.product_quantity

                 customer_email = customer.email_address
                 subject = f"Refund Approved for Order {invoice_item_id}"
                 body = f"""Dear {customer.name},

We have approved your refund request for order ID: {invoice_item_id}.
The amount of {total_refund_amount:.2f} TL will be refunded to your original payment method soon.

Best regards,
Melangé Team
"""

                 # Send email
                 send_refund_email(
                     customer_email=customer_email,
                     subject=subject,
                     body=body,
                     sender_email="SENDER_EMAIL",
                     sender_password="SENDER_PASSWORD"
                 )
                 print(f"Refund approval email sent to {customer_email}")

             except Exception as e:
                 print(f"Error sending refund approval email: {e}")

     # 3) Update the delivery status in the DB
     refund.delivery_status = new_status
     db.session.commit()

     status_message = "Refund approved, stock updated, and email sent" if new_status == 6 else "Refund denied"
     return {"status": "success", "message": f"Order {invoice_item_id}: {status_message}"}, 200

@api.route('/createCategory')
class CategoryCreation(Resource):
    @api.doc(security='BearerAuth')
    @api.expect(category_model, token_parser)
    @token_required_with_role('productManager')
    def post(self):
        """
        Create a category or return the ID if it already exists.
        """
        data = request.json
        category_name = data.get('category_name')
        category_gender = data.get('category_gender')

        # Check if the category already exists
        category = Categories.query.filter_by(category_name=category_name, category_gender=category_gender).first()
        if category:
            return {"status": "success", "message": "Category already exists", "category_id": category.category_id}

        # Create a new category
        new_category = Categories(
            category_name=category_name,
            category_gender=category_gender
        )
        db.session.add(new_category)
        db.session.commit()

        return {"status": "success", "message": "Category created successfully", "category_id": new_category.category_id}

@api.route('/createProduct')
class ProductWithDetailsCreation(Resource):
    @api.doc(security='BearerAuth')
    @api.expect(product_model, token_parser)
    @token_required_with_role('productManager')
    def post(self):
        """
        Create a product with its associated colors and sizes.
        """
        data = request.json

        # Extract product details
        category_id = data.get('category_id')
        product_name = data.get('product_name')
        model = data.get('model')
        serial_number = data.get('serial_number')
        price = data.get('price')
        warranty_status = data.get('warranty_status')
        distributor = data.get('distributor')
        discount_percentage = data.get('discount_percentage', 0.0)

        # Check if the category exists
        category = Categories.query.get(category_id)
        if not category:
            return {"status": "failure", "message": "Category not found"}, 404

        # Create the product
        new_product = Products(
            category_id=category_id,
            product_name=product_name,
            model=model,
            serial_number=serial_number,
            price=-1,
            warranty_status=warranty_status,
            distributor=distributor,
            discount_percentage=discount_percentage
        )
        db.session.add(new_product)
        db.session.commit()

        # Handle colors and sizes
        colors = data.get('colors', [])
        for color_data in colors:
            color_name = color_data.get('color_name')
            product_image = color_data.get('product_image')
            color_description = color_data.get('color_description')

            # Create or check color
            color = ProductColors.query.filter_by(
                base_product_id=new_product.base_product_id,
                color_name=color_name
            ).first()
            if not color:
                color = ProductColors(
                    base_product_id=new_product.base_product_id,
                    color_name=color_name,
                    product_image=product_image,
                    color_description=color_description
                )
                db.session.add(color)
                db.session.commit()

            # Handle sizes for the color
            sizes = color_data.get('sizes', [])
            for size_data in sizes:
                size_name = size_data.get('size_name')
                product_stock = size_data.get('product_stock')

                # Create or check size
                size = ProductSizes.query.filter_by(
                    base_product_id=new_product.base_product_id,
                    color_name=color_name,
                    size_name=size_name
                ).first()
                if not size:
                    size = ProductSizes(
                        base_product_id=new_product.base_product_id,
                        color_name=color_name,
                        size_name=size_name,
                        product_stock=product_stock
                    )
                    db.session.add(size)
                    db.session.commit()

        return {
            "status": "success",
            "message": "Product, colors, and sizes created successfully",
            "base_product_id": new_product.base_product_id
        }
@api.route('/categories')
class ViewCategories(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(token_parser)
    @token_required_with_role('productManager')  # Restrict access to Product Managers
    def get(self):
        """
        Retrieve all categories.
        """
        # Query the database for all categories
        categories = Categories.query.all()

        if not categories:
            return {"status": "failure", "message": "No categories found"}, 404

        # Format the response
        categories_list = [
            {
                "category_id": category.category_id,
                "category_name": category.category_name,
                "category_gender": category.category_gender
            }
            for category in categories
        ]

        return {"status": "success", "categories": categories_list}, 200

@api.route('/deleteProduct/<int:base_product_id>')
class DeleteProduct(Resource):
    @api.doc(security='BearerAuth')
    @token_required_with_role('productManager')
    def delete(self, base_product_id):
        """
        Delete a product and all associated colors and sizes from the database.
        """
        # Check if the product exists
        product = Products.query.get(base_product_id)
        if not product:
            return {"status": "failure", "message": f"Product with ID {base_product_id} not found"}, 404

        try:
            # Delete all sizes associated with the product
            ProductSizes.query.filter_by(base_product_id=base_product_id).delete()

            # Delete all colors associated with the product
            ProductColors.query.filter_by(base_product_id=base_product_id).delete()

            # Delete the product itself
            db.session.delete(product)
            db.session.commit()

            return {
                "status": "success",
                "message": f"Product with ID {base_product_id} and all associated data have been deleted"
            }, 200
        except Exception as e:
            db.session.rollback()
            return {"status": "failure", "message": f"An error occurred while deleting the product: {str(e)}"}, 500

@api.route('/deleteCategory/<int:category_id>')
class DeleteCategory(Resource):
    @api.doc(security='BearerAuth')
    @token_required_with_role('productManager')
    def delete(self, category_id):
        """
        Delete a category and all associated products, colors, and sizes from the database.
        """
        # Check if the category exists
        category = Categories.query.get(category_id)
        if not category:
            return {"status": "failure", "message": f"Category with ID {category_id} not found"}, 404

        try:
            # Fetch all products in the category
            products = Products.query.filter_by(category_id=category_id).all()

            for product in products:
                base_product_id = product.base_product_id

                # Delete all sizes for the product
                ProductSizes.query.filter_by(base_product_id=base_product_id).delete()

                # Delete all colors for the product
                ProductColors.query.filter_by(base_product_id=base_product_id).delete()

                # Delete the product itself
                db.session.delete(product)
                db.session.commit()

            # Finally, delete the category
            db.session.delete(category)
            db.session.commit()


            return {
                "status": "success",
                "message": f"Category with ID {category_id} and all associated products, colors, and sizes have been deleted"
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"status": "failure", "message": f"An error occurred while deleting the category: {str(e)}"}, 500

@api.route('/productDetails/<int:base_product_id>')
class ProductDetails(Resource):
    @api.doc(security='BearerAuth')  # Secure with bearer token
    @token_required_with_role('productManager')  # Restrict access to product managers
    def get(self, base_product_id):
        """
        Retrieve product details, including colors, sizes, and stock levels.
        """
        # Fetch the product
        product = Products.query.get(base_product_id)
        if not product:
            return {"status": "failure", "message": f"Product with ID {base_product_id} not found"}, 404

        # Fetch colors and their sizes with stock
        colors = ProductColors.query.filter_by(base_product_id=base_product_id).all()
        if not colors:
            return {"status": "failure", "message": "No colors found for the product"}, 404

        color_details = []
        for color in colors:
            sizes = ProductSizes.query.filter_by(base_product_id=base_product_id, color_name=color.color_name).all()
            size_details = [
                {
                    "size_name": size.size_name,
                    "product_stock": size.product_stock
                }
                for size in sizes
            ]

            color_details.append({
                "color_name": color.color_name,
                "color_description": color.color_description,
                "sizes": size_details
            })

        return {
            "status": "success",
            "product_name": product.product_name,
            "product_id": base_product_id,
            "colors": color_details
        }, 200

@api.route('/adjustStock')
class AdjustStock(Resource):
    @api.doc(security='BearerAuth')  # Secure with bearer token
    @api.expect(api.model('AdjustStock', {
        'base_product_id': fields.Integer(required=True, description='Base Product ID'),
        'color_name': fields.String(required=True, description='Color Name'),
        'size_name': fields.String(required=True, description='Size Name'),
        'product_stock': fields.Integer(required=True, description='New Stock Level')
    }), token_parser)
    @token_required_with_role('productManager')  # Restrict access to product managers
    def post(self):
        """
        Adjust stock levels for a specific product size.
        """
        data = request.json
        base_product_id = data.get('base_product_id')
        color_name = data.get('color_name')
        size_name = data.get('size_name')
        new_stock = data.get('product_stock')

        # Validate input
        if not (base_product_id and color_name and size_name and new_stock is not None):
            return {"status": "failure", "message": "All fields are required"}, 400

        # Fetch the size record
        size = ProductSizes.query.filter_by(
            base_product_id=base_product_id,
            color_name=color_name,
            size_name=size_name
        ).first()

        if not size:
            return {
                "status": "failure",
                "message": f"Size '{size_name}' with color '{color_name}' for product {base_product_id} not found"
            }, 404

        # Update the stock
        size.product_stock = new_stock
        db.session.commit()

        return {
            "status": "success",
            "message": f"Stock for size '{size_name}' with color '{color_name}' updated to {new_stock}"
        }, 200

@api.route('/getAllProducts')
class GetAllProducts(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(token_parser)
    @token_required_with_role('productManager', 'salesManager')  # Allow both roles to access
    def get(self):
        """
        Retrieve all products with detailed information including
        base product id, category id, category name, product name,
        price, discount percentage, color name, size name, and product stock.
        Results are ordered by base product id in ascending order.
        Accessible by productManager and salesManager.
        """
        try:
            # Query all necessary tables, join the data, and order by base_product_id
            results = db.session.query(
                Products.base_product_id,
                Products.category_id,
                Categories.category_name,
                Products.product_name,
                Products.price,
                Products.discount_percentage,
                ProductColors.color_name,
                ProductSizes.size_name,
                ProductSizes.product_stock
            ).join(
                Categories, Products.category_id == Categories.category_id
            ).join(
                ProductColors, Products.base_product_id == ProductColors.base_product_id
            ).join(
                ProductSizes,
                (ProductColors.base_product_id == ProductSizes.base_product_id) &
                (ProductColors.color_name == ProductSizes.color_name)
            ).order_by(Products.base_product_id.asc()).all()  # Order by base_product_id ascending

            if not results:
                return {"status": "failure", "message": "No products found"}, 404

            # Format the response
            products_list = [
                {
                    "base_product_id": row.base_product_id,
                    "category_id": row.category_id,
                    "category_name": row.category_name,
                    "product_name": row.product_name,
                    "price": float(row.price),
                    "discount_percentage": float(row.discount_percentage),
                    "color_name": row.color_name,
                    "size_name": row.size_name,
                    "product_stock": row.product_stock
                }
                for row in results
            ]

            return {"status": "success", "products": products_list}, 200

        except Exception as e:
            return {"status": "failure", "message": f"An error occurred: {str(e)}"}, 500

from werkzeug.datastructures import FileStorage

upload_parser_protected = api.parser()
upload_parser_protected.add_argument('Authorization', location='headers', required=True, help='Bearer token is required')
upload_parser_protected.add_argument('base_product_id', type=int, required=True, help='Base product ID is required')
upload_parser_protected.add_argument('color_name', type=str, required=True, help='Color name is required')
upload_parser_protected.add_argument('image', location='files', type=FileStorage, required=True, help='Image file is required')

@api.route('/uploadProductColorImage')
class ProtectedUploadProductColorImage(Resource):
    @api.doc(security='BearerAuth')
    @api.expect(upload_parser_protected)
    @token_required_with_role('productManager')
    def post(self):
        """
        Protected endpoint to upload an image for a specific product color.
        Requires product manager role.
        """
        args = upload_parser_protected.parse_args()
        base_product_id = args['base_product_id']
        color_name = args['color_name']
        image_file = args['image']

        # Verify the product color row exists
        product_color = ProductColors.query.filter_by(base_product_id=base_product_id, color_name=color_name).first()
        if not product_color:
            return {
                "status": "failure",
                "message": f"No product color found for base_product_id={base_product_id} and color_name='{color_name}'"
            }, 404

        # Read the file bytes
        image_bytes = image_file.read()
        if not image_bytes:
            return {
                "status": "failure",
                "message": "No image data received"
            }, 400

        # Store the binary data in the product_image column
        product_color.product_image = image_bytes
        db.session.commit()

        return {"status": "success", "message": "Color image uploaded successfully!"}, 200

@api.route('/listColorsWithoutPhoto')
class ListColorsWithoutPhoto(Resource):
    @api.doc(security='BearerAuth')
    @api.expect(token_parser)
    @token_required_with_role('productManager')
    def get(self):
        """
        Return all product colors that have no photo (bytea column is empty or null).
        """
        # You can adapt this filter for your logic:
        #  - product_image == None if you allow a NULL
        #  - product_image == b'' if you allow empty bytes
        from sqlalchemy import or_
        color_rows = ProductColors.query.filter(
            or_(
                ProductColors.product_image == None,
                ProductColors.product_image == b''
            )
        ).all()

        if not color_rows:
            return {
                "status": "failure",
                "message": "No product-colors are missing photos."
            }, 404

        # Prepare a JSON-serializable list
        colors_list = []
        for c in color_rows:
            colors_list.append({
                "base_product_id": c.base_product_id,
                "color_name": c.color_name,
                "color_description": c.color_description,
            })

        return {
            "status": "success",
            "colors_without_photo": colors_list
        }, 200
