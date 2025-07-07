import pytest
from backend.models import db, Products, Categories

def test_create_new_product(test_client):
    """Test creating a new product."""
    with test_client.application.app_context():
        product = Products(
            product_name="Test Product",
            price=100,
            stock=50,
            category_id=1,
            distributor="Test Distributor",
            warranty_status=1
        )
        db.session.add(product)
        db.session.commit()
        assert product.product_name == "Test Product"

def test_product_with_invalid_price(test_client):
    """Test creating a product with an invalid price."""
    with test_client.application.app_context():
        with pytest.raises(ValueError):
            Products(product_name="Invalid Price Product", price=-10, stock=10)

def test_product_stock_update(test_client):
    """Test updating product stock."""
    with test_client.application.app_context():
        product = Products.query.first()
        initial_stock = product.stock
        product.stock += 10
        db.session.commit()
        assert product.stock == initial_stock + 10

def test_product_category_relationship(test_client):
    """Test the relationship between products and categories."""
    with test_client.application.app_context():
        category = Categories(
            category_name="Electronics",
            category_gender="Unisex"
        )
        db.session.add(category)
        db.session.commit()

        product = Products(
            product_name="Smartphone",
            price=1000,
            stock=20,
            category_id=category.category_id,
            distributor="Tech Distributor",
            warranty_status=1
        )
        db.session.add(product)
        db.session.commit()

        assert product.category.category_name == "Electronics"

def test_product_price_update(test_client):
    """Test updating a product's price."""
    with test_client.application.app_context():
        product = Products.query.first()
        product.price = 200
        db.session.commit()
        assert product.price == 200

def test_product_search_by_name(test_client):
    """Test searching for a product by name."""
    with test_client.application.app_context():
        product = Products.query.filter_by(product_name="Test Product").first()
        assert product is not None
        assert product.product_name == "Test Product"

def test_delete_product(test_client):
    """Test deleting a product."""
    with test_client.application.app_context():
        product = Products.query.filter_by(product_name="Test Product").first()
        assert product is not None

        db.session.delete(product)
        db.session.commit()

        deleted_product = Products.query.filter_by(product_name="Test Product").first()
        assert deleted_product is None
