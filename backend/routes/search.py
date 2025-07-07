from flask_restx import Namespace, Resource, reqparse
from backend.models import db, Products, ProductColors

api = Namespace('searchMethods', description='Search functionality for products and colors')

# Define a parser for search parameters
search_parser = reqparse.RequestParser()
search_parser.add_argument('keyword', type=str, required=True, help="Keyword to search for in product name, color name, or color description")

# Route for searching products and colors
@api.route('/search')
class SearchProducts(Resource):
    @api.expect(search_parser)
    def get(self):
        args = search_parser.parse_args()
        keyword = args.get('keyword').strip()  # Ensure keyword is stripped of extra whitespace

        # Build the query
        query = db.session.query(
            Products.base_product_id,
            Products.product_name,
            Products.price,
            ProductColors.color_name,
            ProductColors.color_description
        ).join(ProductColors, Products.base_product_id == ProductColors.base_product_id)

        # Apply search filter
        query = query.filter(
            (Products.product_name.ilike(f"%{keyword}%")) |  # Search in product_name
            (ProductColors.color_name.ilike(f"%{keyword}%")) |  # Search in color_name
            (ProductColors.color_description.ilike(f"%{keyword}%"))  # Search in color_description
        )

        search_results = query.all()

        # Prepare response
        results = [
            {
                "product_id": result.base_product_id,
                "product_name": result.product_name,
                "price": float(result.price),
                "color_name": result.color_name,
                "color_description": result.color_description
            }
            for result in search_results
        ]

        return {"status": "success", "results": results}, 200