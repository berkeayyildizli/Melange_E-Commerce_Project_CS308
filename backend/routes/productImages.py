from flask_restx import Namespace, Resource, reqparse
from flask import send_file, request
from werkzeug.datastructures import FileStorage
from io import BytesIO
from backend.models import db, ProductColors

api = Namespace('productImages', description='API for uploading and retrieving product images')

# Define parsers for the upload and retrieve endpoints
upload_parser = reqparse.RequestParser()
upload_parser.add_argument('base_product_id', type=int, required=True, help='ID of the base product')
upload_parser.add_argument('color_name', type=str, required=True, help='Name of the product color')
upload_parser.add_argument('image', type=FileStorage, location='files', required=True, help='Image file to upload')

retrieve_parser = reqparse.RequestParser()
retrieve_parser.add_argument('base_product_id', type=int, required=True, help='ID of the base product')
retrieve_parser.add_argument('color_name', type=str, required=True, help='Name of the product color')

# Route to upload an image
@api.route('/upload')
class UploadImage(Resource):
    @api.expect(upload_parser)
    def post(self):
        # Parse arguments
        args = upload_parser.parse_args()
        base_product_id = args['base_product_id']
        color_name = args['color_name']
        image_file = args['image']

        # Retrieve the product color using both base_product_id and color_name
        product_color = ProductColors.query.filter_by(base_product_id=base_product_id, color_name=color_name).first()
        if not product_color:
            return {"status": "failure", "message": f"No product color found with base_product_id '{base_product_id}' and color_name '{color_name}'"}, 404

        # Read image bytes and save to database
        image_bytes = image_file.read()
        product_color.product_image = image_bytes  # Changed from product_image_url to product_image

        # Commit changes
        db.session.commit()

        return {"status": "success", "message": "Image uploaded successfully"}

# Route to retrieve an image
@api.route('/retrieve')
class RetrieveImage(Resource):
    @api.expect(retrieve_parser)
    def get(self):
        # Parse query parameters using the parser
        args = retrieve_parser.parse_args()
        base_product_id = args.get('base_product_id')
        color_name = args.get('color_name')

        # Retrieve the product color using both base_product_id and color_name
        product_color = ProductColors.query.filter_by(base_product_id=base_product_id, color_name=color_name).first()
        if not product_color:
            return {"status": "failure", "message": f"No product color found with base_product_id '{base_product_id}' and color_name '{color_name}'"}, 404

        # If there's no image available
        if not product_color.product_image:
            return {"status": "failure", "message": f"No image found for base_product_id '{base_product_id}' and color_name '{color_name}'"}, 404

        # Determine the MIME type (default to 'image/png' if not specified)
        mime_type = 'image/png'  # Adjust if you have different image types

        # Send the image file as a response
        return send_file(
            BytesIO(product_color.product_image),
            mimetype=mime_type,
            as_attachment=False,
            download_name=f"product_{base_product_id}_color_{color_name}.png"
        )
