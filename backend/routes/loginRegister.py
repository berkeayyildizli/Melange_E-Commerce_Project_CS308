from flask_restx import Namespace, Resource, fields
from flask import request, jsonify
from backend.models import db, Customer
from backend.utils import generate_jwt_token
from backend.schemas import init_schemas
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import jwt
from backend.config import Config

api = Namespace(
    'auth',
    description='Customer Registration, Login, and Protected Routes',
    authorizations={
        'BearerAuth': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'JWT token with "Bearer " prefix'
        }
    }
)

schemas = init_schemas(api)
register_model = schemas['register_model']
login_model = schemas['login_model']

# Define models for Swagger UI
token_model = api.model('Token', {
    'token': fields.String(required=True, description='JWT token to decode')
})

change_password_model = api.model('ChangePassword', {
    'old_password': fields.String(required=True, description='The old password'),
    'new_password': fields.String(required=True, description='The new password'),
    'confirm_new_password': fields.String(required=True, description='Confirmation of the new password')
})

@api.route('/register')
class Register(Resource):
    @api.expect(register_model)
    def post(self):
        """Register a new customer"""
        data = request.json
        name = data.get('name')
        surname = data.get('surname')
        email = data.get('email')
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        tax_id = data.get('tax_id')
        address = data.get('address')

        if password != confirm_password:
            return {"status": "failure", "message": "Passwords do not match"}, 400

        if Customer.query.filter_by(email_address=email).first():
            return {"status": "failure", "message": "Email already registered"}, 400

        # Hash the password before storing it
        password_hash = generate_password_hash(password)

        new_user = Customer(
            name=name,
            surname=surname,
            email_address=email,
            password=password_hash,
            tax_id=tax_id,
            home_address=address
        )

        db.session.add(new_user)
        db.session.commit()

        return {"status": "success", "message": "Registration successful"}, 201

@api.route('/login')
class Login(Resource):
    @api.expect(login_model)
    def post(self):
        """Login a customer and generate a JWT token"""
        data = request.json
        email = data.get('email')
        password = data.get('password')

        # Retrieve the customer by email and check the password
        customer = Customer.query.filter_by(email_address=email).first()

        if customer is None or not check_password_hash(customer.password, password):
            return {"status": "failure", "message": "Invalid email or password"}, 401

        # Generate JWT token
        token = generate_jwt_token(customer)
        return {"status": "success", "token": token}

def token_required(f):
    """Decorator to protect routes that require authentication."""
    @wraps(f)
    def decorator(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"status": "failure", "message": "Token is missing"}), 401
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith("Bearer "):
                token = token.split(" ")[1]
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
            current_user = Customer.query.get(payload['customer_id'])
            if current_user is None:
                return jsonify({"status": "failure", "message": "User not found"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"status": "failure", "message": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"status": "failure", "message": "Invalid token"}), 401
        return f(current_user, *args, **kwargs)
    return decorator



@api.route('/protected')
class Protected(Resource):
    @token_required
    def get(self, current_user):
        """Example of a protected route"""
        return {"status": "success", "message": f"Hello, {current_user.name}!"}

@api.route('/decode-token')
class DecodeToken(Resource):
    @api.expect(token_model)
    def post(self):
        """Decode a JWT token and return the payload"""
        data = request.json
        token = data.get('token')  # Get the token from the request body

        if not token:
            return {"status": "failure", "message": "Token is missing"}, 401
        try:
            # Decode the JWT token
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
            return {"status": "success", "payload": payload}
        except jwt.ExpiredSignatureError:
            return {"status": "failure", "message": "Token has expired"}, 401
        except jwt.InvalidTokenError:
            return {"status": "failure", "message": "Invalid token"}, 401

@api.route('/change-password')
class ChangePassword(Resource):
    @api.expect(change_password_model)  # Document the input model for Swagger UI
    @api.doc(security='BearerAuth')  # Indicate that this endpoint requires a JWT token
    @token_required
    def post(self, current_user):
        """
        Change the password of the logged-in user.
        Requires the old password, new password, and confirmation of the new password.
        """
        data = request.json
        old_password = data.get('old_password')  # Receive plaintext old password
        new_password = data.get('new_password')
        confirm_new_password = data.get('confirm_new_password')

        if not old_password or not new_password or not confirm_new_password:
            return {"status": "failure", "message": "All fields are required"}, 400

        # Check if the old password matches the hashed password in the database
        if not check_password_hash(current_user.password, old_password):
            return {"status": "failure", "message": "Old password is incorrect"}, 401

        # Check if the new password matches the confirmation
        if new_password != confirm_new_password:
            return {"status": "failure", "message": "New passwords do not match"}, 400

        # Hash the new password and update the database
        current_user.password = generate_password_hash(new_password)
        db.session.commit()

        return {"status": "success", "message": "Password changed successfully"}
