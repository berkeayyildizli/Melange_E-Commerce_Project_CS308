import hashlib
import jwt
import datetime
from config import Config
from models import Customer


def generate_jwt_token(customer):
    """Generate a JWT token for the customer."""
    payload = {
        'customer_id': customer.customer_id,
        'email': customer.email_address,
        'name': customer.name,
        'surname': customer.surname,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=9999)  #TODO: CHANGE THIS
    }
    token = jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')
    return token


def decode_jwt_token(token):
    """Decode and validate a JWT token."""
    try:
        # Decode the token using the same secret key and algorithm
        decoded_token = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
        return decoded_token
    except jwt.ExpiredSignatureError:
        # Token has expired
        return None
    except jwt.InvalidTokenError:
        # Token is invalid
        return None
