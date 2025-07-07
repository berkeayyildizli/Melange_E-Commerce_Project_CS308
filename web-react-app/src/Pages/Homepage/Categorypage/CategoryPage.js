import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../MainPage/navbar";
import LeftSidebar from "../MainPage/leftsidebar";
import "./CategoryPage.css";

const CategoryPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [sortParams, setSortParams] = useState({
    sort_by: "popularity",
    order: "asc",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const categoryGender = new URLSearchParams(location.search).get("category_gender");

  const fetchProducts = async (sorting = {}) => {
    try {
      const query = new URLSearchParams({
        category_gender: categoryGender || "",
        sort_by: sorting.sort_by || "popularity",
        order: sorting.order || "asc",
      }).toString();

      const response = await fetch(`/sortingMethods/sorting?${query}`);
      const data = await response.json();

      if (data.status === "success") {
        setProducts(data.products);
        setFilteredProducts(data.products);
        extractFilterOptions(data.products);
      } else {
        console.error("Error fetching products:", data.message);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const extractFilterOptions = (products) => {
    const colors = [...new Set(products.flatMap((p) => p.colors || []))];
    const sizes = [...new Set(products.flatMap((p) => p.sizes || []))];
    const categories = [...new Set(products.map((p) => p.category_name || "Unknown Category"))];
    const distributors = [...new Set(products.map((p) => p.distributor || "Unknown Distributor"))];

    setFilterOptions({
      colors,
      sizes,
      category_name: categories,
      distributor: distributors,
    });
  };

  useEffect(() => {
    fetchProducts(sortParams);
  }, [categoryGender, sortParams]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) =>
        Object.keys(product).some((key) => {
          if (["image_url", "product_id"].includes(key)) {
            return false;
          }
          const value = product[key];
          if (Array.isArray(value)) {
            return value.some((item) =>
              item?.toString().toLowerCase().includes(searchQuery.toLowerCase()) || false
            );
          }
          return value?.toString().toLowerCase().includes(searchQuery.toLowerCase()) || false;
        })
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const handleSortSelection = (sorting) => {
    setSortParams((prevParams) => ({ ...prevParams, ...sorting }));
  };

  const handleFilter = (filters) => {
    let filtered = products;
    if (filters.color) {
      filtered = filtered.filter((p) => filters.color.some((color) => (p.colors || []).includes(color)));
    }
    if (filters.size) {
      filtered = filtered.filter((p) => filters.size.some((size) => (p.sizes || []).includes(size)));
    }
    if (filters.category_name) {
      filtered = filtered.filter((p) => filters.category_name.includes(p.category_name));
    }
    if (filters.distributor) {
      filtered = filtered.filter((p) => filters.distributor.includes(p.distributor));
    }
    setFilteredProducts(filtered);
  };

  const handleResetFilters = () => {
    setFilteredProducts(products);
  };

  return (
    <div>
      <Navbar setSearchQuery={setSearchQuery} />
      <div className="category-page">
        <LeftSidebar
          filterOptions={filterOptions}
          onSortSelection={handleSortSelection}
          onFilter={handleFilter}
          onResetFilters={handleResetFilters}
          onSearch={setSearchQuery}
        />
        <div className="product-grid">
          {
            /* Filter out any products where price == -1 */
            filteredProducts.filter((p) => p.price !== -1).length > 0 ? (
              filteredProducts
                .filter((p) => p.price !== -1) // HIDE items that have -1 price
                .map((product, index) => (
                  <div key={index} className="category-item">
                    <img
                      src={product.image_url || "default-image-url.jpg"}
                      alt={product.product_name || "No Name"}
                      className="product-image"
                    />
                    <div className="category-details">
                      <h4>{product.product_name || "Unnamed Product"}</h4>

                      {product.price && product.discount_percentage ? (
                        <div>
                          <p className="product-price">
                            <span className="original-price">{product.price} TL</span>
                            <span className="discount-percentage">
                              {" "}
                              - {product.discount_percentage}%
                            </span>
                          </p>
                          <p className="discounted-price">
                            {(product.price * (1 - product.discount_percentage / 100)).toFixed(2)} TL
                          </p>
                        </div>
                      ) : (
                        <p>
                          {product.price ? `${product.price} TL` : "Price not available"}
                        </p>
                      )}

                      <Link
                        to={`/product_page?product_id=${product.product_id || ""}`}
                        className="view-details-button"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))
            ) : (
              <p>No products match your search.</p>
            )
          }
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
