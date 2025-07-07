import unittest
from flask import Flask
from backend.models import db, Customer, ShoppingBagItem, InvoiceItem, Products, ProductColors, ProductSizes
from backend.config import TestConfig
from backend.routes.checkout import api as checkout_api
from backend.routes.loginRegister import api as login_register_api


def create_test_app():
    """
    Create and configure a Flask application instance for testing.
    """
    app = Flask(__name__)
    app.config.from_object(TestConfig)
    db.init_app(app)

    # Register APIs
    app.register_blueprint(checkout_api, url_prefix='/checkout')
    app.register_blueprint(login_register_api, url_prefix='/auth')
    # Register additional APIs here if needed

    return app


class OrderPlacementTestCase(unittest.TestCase):
    def setUp(self):
        """
        Set up the test environment.
        Initialize the application and the database.
        """
        self.app = create_test_app()  # Use the test-specific app
        self.client = self.app.test_client()  # Create a test client
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Initialize the test database
        db.create_all()

        # Add sample data
        self.add_sample_data()

    def tearDown(self):
        """
        Clean up after tests.
        Remove all database data and dispose of the session.
        """
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def add_sample_data(self):
        """
        Add sample data to the test database.
        """
        # Add a test customer
        customer = Customer(
            customer_id=1,
            name="Test User",
            email_address="test@example.com",
            password="hashedpassword",
            home_address="123 Test Street"
        )
        db.session.add(customer)

        # Add a test product
        product = Products(
            base_product_id=1,
            category_id=1,
            product_name="Test Product",
            model=123,
            serial_number=456,
            price=100,
            average_rating=4.5,
            warranty_status=1,
            discount_percentage=10.0,
            distributor="Test Distributor"
        )
        db.session.add(product)

        # Add product color and size
        color = ProductColors(
            base_product_id=1,
            color_name="Red",
            product_image="test_image_url",
            color_description="Bright Red"
        )
        db.session.add(color)

        size = ProductSizes(
            base_product_id=1,
            color_name="Red",
            size_name="M",
            product_stock=10
        )
        db.session.add(size)

        # Add shopping bag item
        shopping_bag_item = ShoppingBagItem(
            customer_id=1,
            base_product_id=1,
            color_name="Red",
            size_name="M",
            product_quantity=2
        )
        db.session.add(shopping_bag_item)

        db.session.commit()

    def test_order_placement(self):
        """
        Test the order placement functionality.
        """
        # Simulate placing an order
        response = self.client.post('/checkout', headers={
            'Authorization': 'Bearer your_test_jwt_token'
        })

        # Verify the response
        self.assertEqual(response.status_code, 200)
        self.assertIn("success", response.json['status'])
        self.assertEqual(response.json['message'], "Checkout completed successfully")

        # Verify database changes
        invoice_items = InvoiceItem.query.all()
        self.assertEqual(len(invoice_items), 1)  # One invoice item should be created

        shopping_bag_items = ShoppingBagItem.query.filter_by(customer_id=1).all()
        self.assertEqual(len(shopping_bag_items), 0)  # Shopping bag should be cleared

        size = ProductSizes.query.filter_by(
            base_product_id=1,
            color_name="Red",
            size_name="M"
        ).first()
        self.assertEqual(size.product_stock, 8)  # Stock should be reduced


if __name__ == '__main__':
    unittest.main()
