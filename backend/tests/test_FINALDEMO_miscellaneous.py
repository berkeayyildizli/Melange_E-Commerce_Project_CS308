import pytest
from backend.models import db
from backend.sendMail import send_invoice_email
from backend.models import Products

def test_send_email(test_client):
    """Test sending an invoice email."""
    with test_client.application.app_context():
        result = send_invoice_email(
            customer_email="testcustomer@example.com",
            pdf_data=b"Sample PDF Data",
            order_id=1,
            sender_email="test@example.com",
            sender_password="password"
        )
        assert result == "Email sent successfully"

def test_bulk_create_products(test_client):
    """Test the bulk creation of products."""
    with test_client.application.app_context():
        bulk_data = [
            {"product_name": "Bulk Product 1", "price": 50, "stock": 10},
            {"product_name": "Bulk Product 2", "price": 100, "stock": 20},
        ]
        for data in bulk_data:
            product = Products(**data)
            db.session.add(product)
        db.session.commit()
        assert Products.query.count() >= 2

def test_sort_products(test_client):
    """Test sorting products by price."""
    with test_client.application.app_context():
        products = Products.query.order_by(Products.price.desc()).all()
        assert products[0].price >= products[-1].price

def test_bulk_delete_products(test_client):
    """Test bulk deletion of products."""
    with test_client.application.app_context():
        products = Products.query.limit(2).all()
        assert len(products) > 0

        for product in products:
            db.session.delete(product)
        db.session.commit()

        remaining_products = Products.query.limit(2).all()
        assert len(remaining_products) == 0

def test_comment_on_product(test_client):
    """Test adding a comment and rating to a product."""
    with test_client.application.app_context():
        from backend.models import ProductComments

        comment = ProductComments(
            product_id=1,
            customer_id=1,
            rating=5,
            comment="Great product!"
        )
        db.session.add(comment)
        db.session.commit()

        saved_comment = ProductComments.query.filter_by(product_id=1, customer_id=1).first()
        assert saved_comment is not None
        assert saved_comment.comment == "Great product!"
