from flask_restx import Namespace, Resource, reqparse
from sqlalchemy import func
from backend.models import db, Products, Categories, ProductColors,ProductSizes,ProductRating
from sqlalchemy.orm import aliased

api = Namespace('sortingMethods', description='Operations related to sorting')

# Define a parser for sorting and filtering parameters
sorting_parser = reqparse.RequestParser()
sorting_parser.add_argument('sort_by', type=str, required=False, choices=['price', 'discount_percentage','popularity'], help="Field to sort by: 'price' or 'discount_percentage' or 'popularity'")
sorting_parser.add_argument('order', type=str, required=False, choices=['asc', 'desc'], help="Sort order: 'asc' for ascending, 'desc' for descending")
sorting_parser.add_argument('category_id', type=int, required=False, help="Filter by category ID")
sorting_parser.add_argument('category_gender', type=str, required=False, choices=['Men', 'Women', 'Unisex'], help="Filter by category gender")


@api.route('/sorting')
class SortedProducts(Resource):
    @api.expect(sorting_parser)
    def get(self):
        args = sorting_parser.parse_args()
        sort_by = args.get('sort_by', 'price')  # Default to 'price'
        order = args.get('order', 'asc')  # Default to 'asc'

        category_id = args.get('category_id')
        category_gender = args.get('category_gender')

        # Sorting logic
        sort_column = getattr(Products, sort_by, Products.price)
        sort_order = sort_column.asc() if order == 'asc' else sort_column.desc()

        # Subquery for DISTINCT ON equivalent
        subquery = (
            db.session.query(
                Products.base_product_id,
                db.func.min(Products.price).label('min_price')  # Get the product with the lowest price per base_product_id
            )
            .group_by(Products.base_product_id)
            .subquery()
        )

        # Join ProductRating to calculate popularity
        popularity_column = func.coalesce(
            (func.avg(ProductRating.customer_rate) * func.count(ProductRating.customer_rate)), 0
        ).label('popularity')

        query = (
            db.session.query(
                Products.base_product_id,
                Products.product_name,
                Products.price,
                Products.discount_percentage,
                Products.average_rating,
                Products.distributor,
                Categories.category_name,
                Categories.category_gender,
                db.func.array_agg(ProductColors.color_name).label('colors'),
                db.func.array_agg(ProductSizes.size_name).label('sizes'),
                popularity_column
            )
            .join(subquery, Products.base_product_id == subquery.c.base_product_id)
            .join(Categories, Products.category_id == Categories.category_id)
            .outerjoin(ProductColors, Products.base_product_id == ProductColors.base_product_id)
            .outerjoin(ProductSizes, (Products.base_product_id == ProductSizes.base_product_id) &
                                    (ProductColors.color_name == ProductSizes.color_name))
            .outerjoin(ProductRating, Products.base_product_id == ProductRating.product_id)  # Join with ratings
            .group_by(
                Products.base_product_id,
                Products.product_name,
                Products.price,
                Products.discount_percentage,
                Products.average_rating,
                Products.distributor,
                Categories.category_name,
                Categories.category_gender
            )
        )

        # Apply filters
        if category_id:
            query = query.filter(Products.category_id == category_id)
        if category_gender:
            query = query.filter(Categories.category_gender == category_gender)

        # Apply sorting
        if sort_by == "popularity":
            query = query.order_by(popularity_column.desc() if order == 'desc' else popularity_column.asc())
        else:
            query = query.order_by(sort_order)

        # Execute the query
        results = query.all()

        # Prepare response
        products_data = [
            {
                "product_id": product.base_product_id,
                "product_name": product.product_name,
                "price": float(product.price),
                "discount_percentage": float(product.discount_percentage),
                "average_rating": float(product.average_rating),
                "distributor": product.distributor,
                "category_name": product.category_name,
                "category_gender": product.category_gender,
                "colors": product.colors,  # List of available colors
                "sizes": product.sizes,  # List of available sizes
                "popularity": float(product.popularity),
                "image_url": f"/productImages/retrieve?base_product_id={product.base_product_id}&color_name={product.colors[0]}"
            }
            for product in results
        ]

        return {"status": "success", "products": products_data}, 200