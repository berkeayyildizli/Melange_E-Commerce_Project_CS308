from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import CheckConstraint, ForeignKeyConstraint

db = SQLAlchemy()

# Customer model
class Customer(db.Model):
    __tablename__ = 'Customer'
    customer_id = db.Column(db.BigInteger, primary_key=True, autoincrement=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    surname = db.Column(db.String(255), nullable=False)
    tax_id = db.Column(db.BigInteger, nullable=False)
    email_address = db.Column(db.String(255), nullable=False, unique=True)
    home_address = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(512), nullable=False)

# Categories model
class Categories(db.Model):
    __tablename__ = 'Categories'
    category_id = db.Column(db.BigInteger, primary_key=True, autoincrement=True, nullable=False)
    category_name = db.Column(db.String(255), nullable=False)
    category_gender = db.Column(db.String(255), nullable=False)

# Products model
class Products(db.Model):
    __tablename__ = 'Products'
    base_product_id = db.Column(db.BigInteger, primary_key=True, autoincrement=True, nullable=False)
    category_id = db.Column(db.BigInteger, db.ForeignKey('Categories.category_id', ondelete='SET NULL'), nullable=False)
    product_name = db.Column(db.String(255), nullable=False)
    model = db.Column(db.BigInteger, nullable=False)
    serial_number = db.Column(db.BigInteger, nullable=False)
    price = db.Column(db.BigInteger, nullable=False)
    average_rating = db.Column(db.Numeric(2, 1), default=0)
    warranty_status = db.Column(db.BigInteger, nullable=False)
    discount_percentage = db.Column(db.Numeric(5, 2), default=0.00)
    distributor = db.Column(db.String(255), nullable=False)

# Product Colors model
class ProductColors(db.Model):
    __tablename__ = 'Product_Colors'
    base_product_id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    color_name = db.Column(db.String(50), primary_key=True, nullable=False)
    product_image = db.Column(db.String(500), nullable=False)  # Binary data for the image
    color_description = db.Column(db.String(500), nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(['base_product_id'], ['Products.base_product_id'], ondelete='CASCADE'),
    )

# Product Sizes model
class ProductSizes(db.Model):
    __tablename__ = 'Product_Sizes'
    base_product_id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    color_name = db.Column(db.String(50), primary_key=True, nullable=False)
    size_name = db.Column(db.String(50), primary_key=True, nullable=False)
    product_stock = db.Column(db.BigInteger, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(
            ['base_product_id', 'color_name'],
            ['Product_Colors.base_product_id', 'Product_Colors.color_name'],
            ondelete='CASCADE'
        ),
    )

# Wishlist Item model
class WishlistItem(db.Model):
    __tablename__ = 'Wishlist_Item'
    customer_id = db.Column(db.BigInteger, db.ForeignKey('Customer.customer_id', ondelete='CASCADE'), primary_key=True, nullable=False)
    base_product_id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    color_name = db.Column(db.String(50), primary_key=True, nullable=False)
    size_name = db.Column(db.String(50), primary_key=True, nullable=False)
    addition_price = db.Column(db.Numeric(10, 2), nullable=False)
    product_quantity = db.Column(db.BigInteger, nullable=False)
    wishlist_item_addition_date = db.Column(db.DateTime(timezone=True), server_default=db.func.current_timestamp(), nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(
            ['base_product_id'],
            ['Products.base_product_id'],
            ondelete='CASCADE'
        ),
        ForeignKeyConstraint(
            ['base_product_id', 'color_name'],
            ['Product_Colors.base_product_id', 'Product_Colors.color_name'],
            ondelete='CASCADE'
        ),
        ForeignKeyConstraint(
            ['base_product_id', 'color_name', 'size_name'],
            ['Product_Sizes.base_product_id', 'Product_Sizes.color_name', 'Product_Sizes.size_name'],
            ondelete='CASCADE'
        ),
    )

# Shopping Bag Item model
class ShoppingBagItem(db.Model):
    __tablename__ = 'ShoppingBag_Item'
    customer_id = db.Column(db.BigInteger, db.ForeignKey('Customer.customer_id', ondelete='CASCADE'), primary_key=True, nullable=False)
    base_product_id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    color_name = db.Column(db.String(50), primary_key=True, nullable=False)
    size_name = db.Column(db.String(50), primary_key=True, nullable=False)
    product_quantity = db.Column(db.BigInteger, nullable=False)
    added_date = db.Column(db.DateTime(timezone=True), server_default=db.func.current_timestamp(), nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(
            ['base_product_id'],
            ['Products.base_product_id'],
            ondelete='CASCADE'
        ),
        ForeignKeyConstraint(
            ['base_product_id', 'color_name'],
            ['Product_Colors.base_product_id', 'Product_Colors.color_name'],
            ondelete='CASCADE'
        ),
        ForeignKeyConstraint(
            ['base_product_id', 'color_name', 'size_name'],
            ['Product_Sizes.base_product_id', 'Product_Sizes.color_name', 'Product_Sizes.size_name'],
            ondelete='CASCADE'
        ),
    )

# Product Comments model
class ProductComments(db.Model):
    __tablename__ = 'Product_Comments'
    comment_id = db.Column(db.BigInteger, primary_key=True, autoincrement=True, nullable=False)
    customer_id = db.Column(db.BigInteger, db.ForeignKey('Customer.customer_id', ondelete='SET NULL'), nullable=True)
    product_id = db.Column(db.BigInteger, db.ForeignKey('Products.base_product_id', ondelete='CASCADE'), nullable=False)
    comment_content = db.Column(db.String(255), nullable=False)
    comment_status = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.current_timestamp(), nullable=False)

# Product Rating model
class ProductRating(db.Model):
    __tablename__ = 'Product_Rating'
    rate_id = db.Column(db.BigInteger, primary_key=True, autoincrement=True, nullable=False)
    customer_id = db.Column(db.BigInteger, db.ForeignKey('Customer.customer_id', ondelete='SET NULL'), nullable=True)
    product_id = db.Column(db.BigInteger, db.ForeignKey('Products.base_product_id', ondelete='CASCADE'), nullable=False)
    customer_rate = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.current_timestamp(), nullable=False)

    __table_args__ = (
        CheckConstraint('customer_rate BETWEEN 1 AND 5', name='Product_Rating_customer_rate_check'),
    )

# Managers model
class Managers(db.Model):
    __tablename__ = 'Managers'
    manager_id = db.Column(db.BigInteger, primary_key=True, autoincrement=True, nullable=False)
    manager_username = db.Column(db.String(255), nullable=False, unique=True)
    manager_password = db.Column(db.String(512), nullable=False)
    manager_role = db.Column(db.String(255), nullable=False)

# Credit Card model
class CreditCard(db.Model):
    __tablename__ = 'CreditCard'
    card_id = db.Column(db.BigInteger, primary_key=True, autoincrement=True, nullable=False)
    customer_id = db.Column(db.BigInteger, db.ForeignKey('Customer.customer_id', ondelete='CASCADE'), nullable=False)
    card_number = db.Column(db.String(255), nullable=False)
    card_holder_name = db.Column(db.String(255), nullable=False)
    card_expiration_date = db.Column(db.Date, nullable=False)

# Invoice Item model
class InvoiceItem(db.Model):
    __tablename__ = 'Invoice_Item'
    invoice_item_id = db.Column(db.BigInteger, primary_key=True, autoincrement=True, nullable=False)
    customer_id = db.Column(db.BigInteger, db.ForeignKey('Customer.customer_id', ondelete='CASCADE'), nullable=False)
    price_at_purchase = db.Column(db.Numeric(10, 2), nullable=False)
    product_quantity = db.Column(db.BigInteger, nullable=False)
    base_product_id = db.Column(db.BigInteger, nullable=True)
    color_name = db.Column(db.String(50), nullable=True)
    size_name = db.Column(db.String(50), nullable=True)
    purchased_date = db.Column(db.DateTime(timezone=True), server_default=db.func.current_timestamp(), nullable=False)
    delivery_status = db.Column(db.SmallInteger, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(
            ['base_product_id'],
            ['Products.base_product_id'],
            ondelete='SET NULL'
        ),
        ForeignKeyConstraint(
            ['base_product_id', 'color_name'],
            ['Product_Colors.base_product_id', 'Product_Colors.color_name'],
            ondelete='SET NULL'
        ),
        ForeignKeyConstraint(
            ['base_product_id', 'color_name', 'size_name'],
            ['Product_Sizes.base_product_id', 'Product_Sizes.color_name', 'Product_Sizes.size_name'],
            ondelete='SET NULL'
        ),
    )
