from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_restx import Api
from backend.config import Config  # Make sure this path is correct
from backend.models import db  # Make sure this path is correct
from backend.routes.loginRegister import api as login_register_api  # Make sure this path is correct
from backend.routes.categoriesProducts import api as categories_products_api  # Ensure the import path is correct
from backend.routes.productImages import api as product_images_api
from backend.routes.shoppingCart import api as shopping_cart_api  # Ensure the shopping cart namespace is correctly imported
from backend.routes.sort import api as sort_api
from backend.routes.productCreate import api as product_create_api  # Import your new productCreate namespace
from backend.routes.search import api as search_api
from backend.routes.checkout import api as checkout_api
from backend.routes.bulkCreate import api as bulk_create_api
from backend.routes.account import api as account_api
from backend.routes.commentRating import api as comment_rating_api
from backend.routes.adminLogin import api as admin_login_api
from backend.routes.adminMethods import api as admin_methods_api
from backend.routes.salesManagerMethods import api as sales_manager_methods_api
from backend.routes.wishlist import wishlist_api

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # Adjust CORS settings as needed
db.init_app(app)

# Initialize Flask-RESTX API
api = Api(app, title='Customer API', description='API for Customer Registration, Login, Product Management, and Protected Routes')

# Add namespaces from the routes
api.add_namespace(login_register_api)
api.add_namespace(categories_products_api)
api.add_namespace(product_images_api)
api.add_namespace(shopping_cart_api)
api.add_namespace(sort_api)
api.add_namespace(search_api)
api.add_namespace(product_create_api)  # Add your new productCreate namespace
api.add_namespace(checkout_api)
api.add_namespace(bulk_create_api)
api.add_namespace(account_api)
api.add_namespace(comment_rating_api)
api.add_namespace(admin_login_api)
api.add_namespace(admin_methods_api)
api.add_namespace(sales_manager_methods_api)
api.add_namespace(wishlist_api)


if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Make sure this creates all tables based on the updated models
    app.run(host='0.0.0.0', port=8000, debug=True)  # Adjust the host and port as necessary
