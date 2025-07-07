from flask_restx import fields, Api

def init_schemas(api: Api):
    schemas = {
        "register_model": api.model('Register', {
            'name': fields.String(required=True, description='First name of the customer'),
            'surname': fields.String(required=True, description='Last name of the customer'),
            'email': fields.String(required=True, description='Email address of the customer'),
            'password': fields.String(required=True, description='Password for the customer account'),
            'confirm_password': fields.String(required=True, description='Password confirmation'),
            'tax_id': fields.Integer(required=True, description='Tax ID of the customer'),
            'address': fields.String(required=True, description='Home address of the customer')
        }),

        "login_model": api.model('Login', {
            'email': fields.String(required=True, description='Email address of the customer'),
            'password': fields.String(required=True, description='Password for the customer account')
        }),

        "category_model": api.model('Category', {
            'category_id': fields.Integer(required=True, description='Category ID'),
            'category_name': fields.String(required=True, description='Category Name'),
            'category_gender': fields.String(required=True, description='Category Gender')
        }),

        "product_model": api.model('Product', {
            'base_product_id': fields.Integer(required=True, description='Product ID'),
            'category_id': fields.Integer(required=True, description='Category ID'),
            'product_name': fields.String(required=True, description='Name of the Product'),
            'model': fields.Integer(required=True, description='Product Model Number'),
            'serial_number': fields.Integer(required=True, description='Product Serial Number'),
            'price': fields.Float(required=True, description='Product Price'),
            'average_rating': fields.Float(description='Average Rating of Product'),
            'warranty_status': fields.Integer(required=True, description='Warranty Status'),
            'discount_percentage': fields.Float(description='Discount Percentage of Product'),
            'distributor': fields.String(required=True, description='Distributor Name'),
            'category_name': fields.String(description='Category Name')
        })
    }

    return schemas
