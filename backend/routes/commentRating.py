from flask_restx import Namespace, Resource, fields, reqparse
from flask import request, jsonify
from backend.models import db, ProductComments, ProductRating, InvoiceItem
from backend.utils import decode_jwt_token

# Namespace for comment and rating-related operations
api = Namespace(
    'commentRating',
    description='Operations related to product comments and ratings',
    authorizations={
        'BearerAuth': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'Paste the JWT token here with "Bearer " prefix'
        }
    }
)

# Parsers for Swagger documentation
comment_parser = api.parser()
comment_parser.add_argument('Authorization', location='headers', required=True, help='Bearer token is required')

rating_parser = api.parser()
rating_parser.add_argument('Authorization', location='headers', required=True, help='Bearer token is required')

# Models for Swagger documentation
make_comment_model = api.model('MakeComment', {
    'product_id': fields.Integer(required=True, description='The ID of the product'),
    'comment_content': fields.String(required=True, description='The content of the comment')
})

give_rating_model = api.model('GiveRating', {
    'product_id': fields.Integer(required=True, description='The ID of the product'),
    'customer_rate': fields.Integer(required=True, description='The rating for the product (1 to 5)')
})

mycomments_model = api.model('MyComments', {

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


# POST /commentRating/comment: Make a comment on a product
@api.route('/comment')
class MakeComment(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(make_comment_model, comment_parser)
    @token_required
    def post(self):
        data = request.json
        customer_id = request.customer['customer_id']
        product_id = data.get('product_id')
        comment_content = data.get('comment_content')

        # Check if the user purchased the product
        purchased_item = InvoiceItem.query.filter_by(customer_id=customer_id, base_product_id=product_id).first()
        if not purchased_item:
            return {"status": "failure", "message": "You can only comment on products you have purchased."}, 403

        # Check if the user already commented on the product
        existing_comment = ProductComments.query.filter_by(customer_id=customer_id, product_id=product_id).first()
        if existing_comment:
            return {"status": "failure", "message": "You have already commented on this product."}, 400

        # Add the comment with comment_status = 0 (pending approval)
        new_comment = ProductComments(
            customer_id=customer_id,
            product_id=product_id,
            comment_content=comment_content,
            comment_status=0  # Pending approval
        )
        db.session.add(new_comment)
        db.session.commit()

        return {"status": "success", "message": "Comment added successfully and is pending approval."}, 201


# GET /commentRating/mycomments: View user comments
@api.route('/mycomments')
class MyComments(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(comment_parser)
    @token_required
    def get(self):
        customer_id = request.customer['customer_id']

        # Query the database to get all comments for the customer
        comments = ProductComments.query.filter_by(customer_id=customer_id).all()

        if not comments:
            return {"status": "failure", "message": "No comments found"}, 404

        # Format the response
        response_data = [
            {
                "comment_id": comment.comment_id,
                "product_id": comment.product_id,
                "comment_content": comment.comment_content,
                "comment_status": comment.comment_status,
                "created_at": comment.created_at.isoformat()
            }
            for comment in comments
        ]

        return {"status": "success", "comments": response_data}, 200


# POST /commentRating/rating: Give a rating to a product
@api.route('/rating')
class GiveRating(Resource):
    @api.doc(security='BearerAuth')  # Attach security to this method
    @api.expect(give_rating_model, rating_parser)
    @token_required
    def post(self):
        data = request.json
        customer_id = request.customer['customer_id']
        product_id = data.get('product_id')
        customer_rate = data.get('customer_rate')

        # Check if the user purchased the product
        purchased_item = InvoiceItem.query.filter_by(customer_id=customer_id, base_product_id=product_id).first()
        if not purchased_item:
            return {"status": "failure", "message": "You can only rate products you have purchased."}, 403

        # Check if the user already rated the product
        existing_rating = ProductRating.query.filter_by(customer_id=customer_id, product_id=product_id).first()
        if existing_rating:
            return {"status": "failure", "message": "You have already rated this product."}, 400

        # Validate rating range
        int_rate = int(customer_rate)
        if not (1 <= int_rate <= 5):
            return {"status": "failure", "message": "Rating must be between 1 and 5."}, 400

        # Add the rating
        new_rating = ProductRating(
            customer_id=customer_id,
            product_id=product_id,
            customer_rate=int_rate
        )
        db.session.add(new_rating)
        db.session.commit()

        return {"status": "success", "message": "Rating added successfully."}, 201