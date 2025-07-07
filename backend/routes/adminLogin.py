from flask_restx import Namespace, Resource, fields
from flask import request, jsonify
from backend.models import db, Managers
from werkzeug.security import generate_password_hash, check_password_hash
from backend.config import Config
import jwt

# Namespace for admin authentication
api = Namespace(
    'adminAuth',
    description='Admin Registration, Login, and Authentication',
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
admin_register_model = api.model('AdminRegister', {
    'username': fields.String(required=True, description='Admin username'),
    'password': fields.String(required=True, description='Admin password'),
    'confirm_password': fields.String(required=True, description='Confirmation of the admin password'),
    'role': fields.String(required=True, description='Role of the admin (e.g., superadmin, editor)')
})

admin_login_model = api.model('AdminLogin', {
    'username': fields.String(required=True, description='Admin username'),
    'password': fields.String(required=True, description='Admin password')
})

token_model = api.model('adminToken', {
    'adminToken': fields.String(required=True, description='JWT token to decode')
})

# Generate JWT token for admins
def generate_admin_jwt_token(admin):
    """Generate a JWT token for the admin with role information."""
    payload = {
        'admin_id': admin.manager_id,
        'username': admin.manager_username,
        'role': admin.manager_role,
    }
    adminToken = jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')
    return adminToken


@api.route('/register')
class AdminRegister(Resource):
    @api.expect(admin_register_model)
    def post(self):
        """Register a new admin"""
        data = request.json
        username = data.get('username')
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        role = data.get('role')

        # Validate password and confirmation
        if password != confirm_password:
            return {"status": "failure", "message": "Passwords do not match"}, 400

        # Check if the username is already taken
        if Managers.query.filter_by(manager_username=username).first():
            return {"status": "failure", "message": "Username already registered"}, 400

        # Hash the password before storing it
        password_hash = generate_password_hash(password)

        # Create and save the new admin
        new_admin = Managers(
            manager_username=username,
            manager_password=password_hash,
            manager_role=role
        )

        db.session.add(new_admin)
        db.session.commit()

        return {"status": "success", "message": "Admin registration successful"}, 201


@api.route('/login')
class AdminLogin(Resource):
    @api.expect(admin_login_model)
    def post(self):
        """Login an admin and generate a JWT token"""
        data = request.json
        username = data.get('username')
        password = data.get('password')

        # Retrieve the admin by username and check the password
        admin = Managers.query.filter_by(manager_username=username).first()

        if admin is None or not check_password_hash(admin.manager_password, password):
            return {"status": "failure", "message": "Invalid username or password"}, 401

        # Generate JWT token with role
        adminToken = generate_admin_jwt_token(admin)
        return {"status": "success", "token": adminToken}, 200


@api.route('/decode-token')
class DecodeToken(Resource):
    @api.expect(token_model)
    def post(self):
        """Decode a JWT token and return the payload"""
        data = request.json
        token = data.get('adminToken')  # Get the token from the request body

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