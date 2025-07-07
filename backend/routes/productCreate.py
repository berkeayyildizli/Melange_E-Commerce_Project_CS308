from flask_restx import Namespace, Resource, fields
from flask import request, jsonify
from backend.models import db, Categories, Products, ProductColors, ProductSizes

api = Namespace('productCreate', description='Operations related to creating a new product')

# Models for Swagger documentation
category_model = api.model('Category', {
    'category_name': fields.String(required=True, description='Name of the category'),
    'category_gender': fields.String(required=True, description='Gender for the category')
})

product_model = api.model('Product', {
    'category_id': fields.Integer(required=True, description='ID of the category to assign the product to'),
    'product_name': fields.String(required=True, description='Name of the product'),
    'model': fields.Integer(required=True, description='Model number of the product'),
    'serial_number': fields.Integer(required=True, description='Serial number of the product'),
    'price': fields.Float(required=True, description='Price of the product'),
    'warranty_status': fields.Integer(required=True, description='Warranty status of the product'),
    'distributor': fields.String(required=True, description='Distributor of the product'),
    'discount_percentage': fields.Float(required=False, description='Discount percentage', default=0.0)
})

color_model = api.model('ProductColor', {
    'base_product_id': fields.Integer(required=True, description='ID of the base product'),
    'color_name': fields.String(required=True, description='Name of the color'),
    'product_image': fields.String(required=True, description='Image URL for the product color'),
    'color_description': fields.String(required=True, description='Description of the color')
})

size_model = api.model('ProductSize', {
    'base_product_id': fields.Integer(required=True, description='ID of the base product'),
    'color_name': fields.String(required=True, description='Color name of the product'),
    'size_name': fields.String(required=True, description='Size name of the product'),
    'product_stock': fields.Integer(required=True, description='Stock quantity for this size')
})

# POST /product-create/category: Create or select a category
@api.route('/category')
class CategoryCreation(Resource):
    @api.expect(category_model)
    def post(self):
        data = request.json
        category_name = data.get('category_name')
        category_gender = data.get('category_gender')

        # Check if the category already exists
        category = Categories.query.filter_by(category_name=category_name, category_gender=category_gender).first()
        if category:
            return {"status": "success", "message": "Category already exists", "category_id": category.category_id}

        # Create a new category
        new_category = Categories(
            category_name=category_name,
            category_gender=category_gender
        )
        db.session.add(new_category)
        db.session.commit()

        return {"status": "success", "message": "Category created successfully", "category_id": new_category.category_id}

# POST /product-create/product: Create a product
@api.route('/product')
class ProductCreation(Resource):
    @api.expect(product_model)
    def post(self):
        data = request.json
        category_id = data.get('category_id')
        product_name = data.get('product_name')
        model = data.get('model')
        serial_number = data.get('serial_number')
        price = data.get('price')
        warranty_status = data.get('warranty_status')
        distributor = data.get('distributor')
        discount_percentage = data.get('discount_percentage', 0.0)

        # Check if the category exists
        category = Categories.query.get(category_id)
        if not category:
            return {"status": "failure", "message": "Category not found"}, 404

        # Create the product
        new_product = Products(
            category_id=category_id,
            product_name=product_name,
            model=model,
            serial_number=serial_number,
            price=price,
            warranty_status=warranty_status,
            distributor=distributor,
            discount_percentage=discount_percentage
        )
        db.session.add(new_product)
        db.session.commit()

        return {"status": "success", "message": "Product created successfully", "base_product_id": new_product.base_product_id}

# POST /product-create/color: Create or select a color
@api.route('/color')
class ProductColorCreation(Resource):
    @api.expect(color_model)
    def post(self):
        data = request.json
        base_product_id = data.get('base_product_id')
        color_name = data.get('color_name')
        product_image = data.get('product_image')
        color_description = data.get('color_description')

        # Check if the product exists
        product = Products.query.get(base_product_id)
        if not product:
            return {"status": "failure", "message": "Product not found"}, 404

        # Check if the color already exists
        color = ProductColors.query.filter_by(base_product_id=base_product_id, color_name=color_name).first()
        if color:
            return {"status": "success", "message": "Color already exists"}

        # Create a new color
        new_color = ProductColors(
            base_product_id=base_product_id,
            color_name=color_name,
            product_image=product_image,
            color_description=color_description
        )
        db.session.add(new_color)
        db.session.commit()

        return {"status": "success", "message": "Color created successfully"}

# POST /product-create/size: Create or select a size
@api.route('/size')
class ProductSizeCreation(Resource):
    @api.expect(size_model)
    def post(self):
        data = request.json
        base_product_id = data.get('base_product_id')
        color_name = data.get('color_name')
        size_name = data.get('size_name')
        product_stock = data.get('product_stock')

        # Check if the color exists
        color = ProductColors.query.filter_by(base_product_id=base_product_id, color_name=color_name).first()
        if not color:
            return {"status": "failure", "message": "Color not found for this product"}, 404

        # Check if the size already exists
        size = ProductSizes.query.filter_by(
            base_product_id=base_product_id, color_name=color_name, size_name=size_name
        ).first()
        if size:
            return {"status": "success", "message": "Size already exists"}

        # Create a new size
        new_size = ProductSizes(
            base_product_id=base_product_id,
            color_name=color_name,
            size_name=size_name,
            product_stock=product_stock
        )
        db.session.add(new_size)
        db.session.commit()

        return {"status": "success", "message": "Size created successfully"}
