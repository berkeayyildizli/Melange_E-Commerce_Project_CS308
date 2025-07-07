from backend.models import db, Customer, ShoppingBagItem, InvoiceItem, Products, ProductColors, ProductSizes
from backend.config import TestConfig
from backend.routes.checkout import api as checkout_api
from backend.routes.loginRegister import api as login_register_api