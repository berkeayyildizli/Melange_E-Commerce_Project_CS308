import pytest
from werkzeug.security import generate_password_hash, check_password_hash
from backend.models import db, Customer
from backend.utils import generate_jwt_token
import jwt
from backend.config import Config

def test_register_new_user(test_client):
    """Test registering a new user."""
    with test_client.application.app_context():
        user = Customer(
            name="John",
            surname="Doe",
            tax_id=123456789,
            email_address="johndoe@example.com",
            home_address="123 Main Street",
            password=generate_password_hash("password123")
        )
        db.session.add(user)
        db.session.commit()
        assert user.email_address == "johndoe@example.com"

def test_duplicate_user_registration(test_client):
    """Test that registering with an existing email fails."""
    with test_client.application.app_context():
        user1 = Customer(
            name="Jane",
            surname="Doe",
            tax_id=987654321,
            email_address="janedoe@example.com",
            home_address="456 Elm Street",
            password=generate_password_hash("password123")
        )
        db.session.add(user1)
        db.session.commit()

        user2 = Customer(
            name="Jane",
            surname="Doe2",
            tax_id=123456789,
            email_address="janedoe@example.com",  # Duplicate email
            home_address="789 Pine Street",
            password=generate_password_hash("password123")
        )
        with pytest.raises(Exception):
            db.session.add(user2)
            db.session.commit()

def test_valid_user_login(test_client):
    """Test logging in with valid credentials."""
    with test_client.application.app_context():
        user = Customer.query.filter_by(email_address="johndoe@example.com").first()
        assert user is not None
        assert check_password_hash(user.password, "password123")

def test_invalid_user_login(test_client):
    """Test logging in with invalid credentials."""
    with test_client.application.app_context():
        user = Customer.query.filter_by(email_address="johndoe@example.com").first()
        assert user is not None
        assert not check_password_hash(user.password, "wrongpassword")

def test_generate_valid_jwt_token(test_client):
    """Test generating a valid JWT token."""
    with test_client.application.app_context():
        user = Customer.query.filter_by(email_address="johndoe@example.com").first()
        payload = {"user_id": user.customer_id, "email": user.email_address}
        token = jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")
        decoded = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        assert decoded["user_id"] == user.customer_id

def test_decode_invalid_jwt_token(test_client):
    """Test decoding an invalid JWT token."""
    invalid_token = "invalid.jwt.token"
    with pytest.raises(jwt.InvalidTokenError):
        jwt.decode(invalid_token, Config.SECRET_KEY, algorithms=["HS256"])

def test_user_password_change(test_client):
    """Test changing a user's password."""
    with test_client.application.app_context():
        user = Customer.query.filter_by(email_address="johndoe@example.com").first()
        user.password = generate_password_hash("newpassword")
        db.session.commit()
        assert check_password_hash(user.password, "newpassword")


def test_user_delete_account(test_client):
    """Test deleting a user's account."""
    with test_client.application.app_context():
        user = Customer.query.filter_by(email_address="johndoe@example.com").first()
        assert user is not None

        db.session.delete(user)
        db.session.commit()

        deleted_user = Customer.query.filter_by(email_address="johndoe@example.com").first()
        assert deleted_user is None