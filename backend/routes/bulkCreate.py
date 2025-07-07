from flask_restx import Namespace, Resource, fields
from flask import request
from backend.models import db, Categories, Products, ProductColors, ProductSizes

api = Namespace('bulkCreate', description='Operations related to creating a new product with associated data')

# Models for Swagger documentation
product_creation_model = api.model('ProductCreation', {
    'category_name': fields.String(required=True, description='Name of the category'),
    'category_gender': fields.String(required=True, description='Gender for the category'),
    'product_name': fields.String(required=True, description='Name of the product'),
    'model': fields.Integer(required=True, description='Model number of the product'),
    'serial_number': fields.Integer(required=True, description='Serial number of the product'),
    'price': fields.Float(required=True, description='Price of the product'),
    'warranty_status': fields.Integer(required=True, description='Warranty status of the product'),
    'distributor': fields.String(required=True, description='Distributor of the product'),
    'discount_percentage': fields.Float(required=False, description='Discount percentage', default=0.0),
    'colors': fields.List(fields.Nested(api.model('Color', {
        'color_name': fields.String(required=True, description='Name of the color'),
        'product_image': fields.String(required=True, description='Image URL for the product color'),
        'color_description': fields.String(required=True, description='Description of the color'),
        'sizes': fields.List(fields.Nested(api.model('Size', {
            'size_name': fields.String(required=True, description='Size name of the product'),
            'product_stock': fields.Integer(required=True, description='Stock quantity for this size')
        })))
    })))
})


@api.route('/')
class ProductCreation(Resource):
    @api.expect(product_creation_model)
    def post(self):
        data = request.json

        # Extract category details
        category_name = data.get('category_name')
        category_gender = data.get('category_gender')

        # Check or create category
        category = Categories.query.filter_by(category_name=category_name, category_gender=category_gender).first()
        if not category:
            category = Categories(
                category_name=category_name,
                category_gender=category_gender
            )
            db.session.add(category)
            db.session.commit()

        # Extract product details
        product_name = data.get('product_name')
        model = data.get('model')
        serial_number = data.get('serial_number')
        price = data.get('price')
        warranty_status = data.get('warranty_status')
        distributor = data.get('distributor')
        discount_percentage = data.get('discount_percentage', 0.0)

        # Create the product
        new_product = Products(
            category_id=category.category_id,
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

        # Handle colors and sizes
        colors = data.get('colors', [])
        for color_data in colors:
            color_name = color_data.get('color_name')
            product_image = color_data.get('product_image')
            color_description = color_data.get('color_description')

            # Create or check color
            color = ProductColors.query.filter_by(base_product_id=new_product.base_product_id,
                                                  color_name=color_name).first()
            if not color:
                color = ProductColors(
                    base_product_id=new_product.base_product_id,
                    color_name=color_name,
                    product_image=product_image,
                    color_description=color_description
                )
                db.session.add(color)
                db.session.commit()

            # Handle sizes for the color
            sizes = color_data.get('sizes', [])
            for size_data in sizes:
                size_name = size_data.get('size_name')
                product_stock = size_data.get('product_stock')

                # Create or check size
                size = ProductSizes.query.filter_by(
                    base_product_id=new_product.base_product_id, color_name=color_name, size_name=size_name
                ).first()
                if not size:
                    size = ProductSizes(
                        base_product_id=new_product.base_product_id,
                        color_name=color_name,
                        size_name=size_name,
                        product_stock=product_stock
                    )
                    db.session.add(size)
                    db.session.commit()

        return {"status": "success", "message": "Product, colors, and sizes created successfully"}
