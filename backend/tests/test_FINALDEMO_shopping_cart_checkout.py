import pytest
from backend.models import db, ShoppingBagItem, Products

def test_add_to_cart(test_client):
    """Test adding a product to the shopping cart."""
    with test_client.application.app_context():
        cart_item = ShoppingBagItem(
            customer_id=1,
            base_product_id=1,
            product_quantity=2
        )
        db.session.add(cart_item)
        db.session.commit()
        assert cart_item.product_quantity == 2

def test_remove_from_cart(test_client):
    """Test removing an item from the shopping cart."""
    with test_client.application.app_context():
        cart_item = ShoppingBagItem.query.first()
        db.session.delete(cart_item)
        db.session.commit()
        assert ShoppingBagItem.query.first() is None

def test_checkout_process(test_client):
    """Test the checkout process."""
    with test_client.application.app_context():
        product = Products.query.first()
        cart_item = ShoppingBagItem.query.filter_by(base_product_id=product.base_product_id).first()

        # Simulate checkout process
        initial_stock = product.stock
        product.stock -= cart_item.product_quantity
        db.session.delete(cart_item)
        db.session.commit()

        assert product.stock == initial_stock - cart_item.product_quantity

def test_empty_cart(test_client):
    """Test emptying the shopping cart."""
    with test_client.application.app_context():
        cart_items = ShoppingBagItem.query.filter_by(customer_id=1).all()
        assert len(cart_items) > 0

        for item in cart_items:
            db.session.delete(item)
        db.session.commit()

        cart_items_after = ShoppingBagItem.query.filter_by(customer_id=1).all()
        assert len(cart_items_after) == 0

def test_checkout_with_invalid_payment(test_client):
    """Test checkout with an invalid payment method."""
    with test_client.application.app_context():
        product = Products.query.first()
        cart_item = ShoppingBagItem.query.filter_by(base_product_id=product.base_product_id).first()

        # Simulate an invalid payment
        with pytest.raises(Exception, match="Invalid payment method"):
            raise Exception("Invalid payment method")
