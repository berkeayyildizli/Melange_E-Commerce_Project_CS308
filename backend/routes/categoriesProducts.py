from flask_restx import Namespace, Resource, reqparse
from flask import jsonify, send_file, request
from backend.models import db, Categories, Products, ProductColors, ProductSizes, ProductComments
import io

api = Namespace('categoriesProducts', description='Operations related to product categories and products')

# Initialize parsers
get_products_parser = reqparse.RequestParser()
get_products_parser.add_argument('category_name', type=str, required=True, help='Category name is required to filter products')

get_products_by_gender_parser = reqparse.RequestParser()
get_products_by_gender_parser.add_argument('category_gender', type=str, required=True, help='Category gender is required to filter products')

# Route to get all categories
@api.route('/categories')
class GetCategories(Resource):
    def get(self):
        categories = Categories.query.all()
        return jsonify(
            [{"category_id": c.category_id, "category_name": c.category_name, "category_gender": c.category_gender} for c in categories]
        )
    
# Route to get product details by base_product_id
@api.route('/products/<int:base_id>/details')
class GetProductDetails(Resource):
    def get(self, base_id):
        product = Products.query.filter_by(base_product_id=base_id).first()
        if not product:
            return {"status": "failure", "message": f"No product found with base_id '{base_id}'"}, 404

        # Fetch all colors for this base_id, each with associated sizes
        color_variants = ProductColors.query.filter_by(base_product_id=base_id).all()
        colors_data = []
        for color in color_variants:
            sizes = ProductSizes.query.filter_by(base_product_id=base_id, color_name=color.color_name).all()
            sizes_data = [{"size_name": size.size_name, "stock": int(size.product_stock)} for size in sizes]

            image_url = f"/productImages/retrieve?base_product_id={base_id}&color_name={color.color_name}"

            colors_data.append({
                "color_name": color.color_name,
                "color_description": color.color_description,
                "sizes": sizes_data,
                "image_url": image_url
            })

        # Fetch comments related to this product base_id
        comments = ProductComments.query.filter_by(product_id=base_id).all()
        comments_data = []
        for comment in comments:
            if (comment.comment_status == 1):
                comments_data.append({
                    "comment_id": comment.comment_id,
                    "customer_id": comment.customer_id,
                    "content": comment.comment_content,
                    "status": comment.comment_status,
                    "created_at": comment.created_at.isoformat() if comment.created_at else None
                })

        response_data = {
            "product_id": product.base_product_id,
            "product_name": product.product_name,
            "model": int(product.model) if product.model is not None else None,
            "serial_number": int(product.serial_number) if product.serial_number is not None else None,
            "price": float(product.price) if product.price is not None else None,
            "average_rating": float(product.average_rating) if product.average_rating is not None else None,
            "warranty_status": int(product.warranty_status) if product.warranty_status is not None else None,
            "distributor": product.distributor,
            "colors": colors_data,
            "comments": comments_data,
            "discount_percentage": product.discount_percentage
        }

        return jsonify(response_data)