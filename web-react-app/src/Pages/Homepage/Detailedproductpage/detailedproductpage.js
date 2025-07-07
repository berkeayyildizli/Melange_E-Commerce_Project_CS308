import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./detailedproductpage.css";
import Navbar from "../MainPage/navbar";
import { addItemToBag } from "../MainPage/utilities"; // Utility functions

const DetailedProductPage = () => {
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [outOfStockMessage, setOutOfStockMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // <-- NEW

  const location = useLocation();
  const baseId = new URLSearchParams(location.search).get("product_id");

  useEffect(() => {
    if (baseId) {
      fetch(`/categoriesProducts/products/${baseId}/details`)
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Product not found");
          }
        })
        .then((data) => {
          setProduct(data);
          if (data.colors.length > 0) {
            setSelectedColor(data.colors[0].color_name);
          }
        })
        .catch((error) => {
          console.error("Error fetching product data:", error);
          setNotFound(true);
        });
    }
  }, [baseId]);

  useEffect(() => {
    setSelectedSize(null);
  }, [selectedColor]);

  // Add this effect to clear successMessage after 2 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 2000);

      // Cleanup: clear the timeout if the component unmounts or successMessage changes
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const addToCart = async () => {
    if (!product) return;

    const selectedColorData = product.colors.find(
      (color) => color.color_name === selectedColor
    );
    const selectedSizeData = selectedColorData.sizes.find(
      (size) => size.size_name === selectedSize
    );

    if (selectedSizeData.stock === 0) {
      setOutOfStockMessage(
        "This product is out of stock and cannot be added to the shopping bag."
      );
      setSuccessMessage(""); // clear any prior success message
      return;
    }

    // Clear messages
    setOutOfStockMessage("");
    setSuccessMessage("");

    // Build the cart item
    const cartItem = {
      product_id: product.product_id,
      product_name: product.product_name,
      color_name: selectedColor,
      size_name: selectedSize,
      quantity: 1,
      price: product.price,
      discount_percentage: product.discount_percentage,
      product_stock: selectedSizeData.stock,
    };

    try {
      const existingBag = JSON.parse(localStorage.getItem("shoppingBag")) || [];
      await addItemToBag(existingBag, cartItem);

      setSuccessMessage("Item added to cart successfully!");

      // Dispatch event so bag updates across the site
      const event = new Event("shoppingBagUpdated");
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error adding item to cart:", error);
      setOutOfStockMessage("Failed to add item to cart. Please try again later.");
    }
  };

  const addToWishlist = async () => {
    if (!selectedSize || !selectedColor) {
      setOutOfStockMessage(
        "Please select a size and color before adding to the wishlist."
      );
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setOutOfStockMessage("You need to log in to add items to the wishlist.");
      return;
    }

    try {
      const response = await fetch("/wishlist/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base_product_id: product.product_id,
          color_name: selectedColor,
          size_name: selectedSize,
          addition_price: 0,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        alert("Product added to wishlist.");
      } else {
        console.error("Failed to add item to wishlist:", data.message);
      }
    } catch (error) {
      console.error("Error adding item to wishlist:", error);
    }
  };

  useEffect(() => {
    const updateBag = () => setReloadKey((prev) => prev + 1);
    window.addEventListener("shoppingBagUpdated", updateBag);
    return () => window.removeEventListener("shoppingBagUpdated", updateBag);
  }, []);

  const isAddToCartDisabled = !baseId || !selectedColor || !selectedSize;

  if (notFound) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Navbar />
        <h1>Product Not Found</h1>
        <p>The product you are looking for does not exist or has been removed.</p>
        <a href="/" style={{ color: "#007bff", textDecoration: "underline" }}>
          Go back to the homepage
        </a>
      </div>
    );
  }

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar />
      <div className="detailed-product-page">
        {/* Image Carousel */}
        <div className="product-carousel">
          <img
            src={product.colors.find((c) => c.color_name === selectedColor)?.image_url}
            alt="Main Product"
            className="carousel-main-image"
          />
          <div className="carousel-thumbnails">
            {product.colors.map((color) => (
              <img
                key={color.color_name}
                src={color.image_url}
                alt={`${color.color_name} Thumbnail`}
                onClick={() => setSelectedColor(color.color_name)}
                className={`carousel-thumbnail ${
                  selectedColor === color.color_name ? "active" : ""
                }`}
              />
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="product-details">
          <h1>{product.product_name}</h1>
          <div className="product-rating">
            <span>{product.average_rating}</span> ★{" "}
            <span>{product.comments.length} Comments</span>
          </div>
          <p className="product-price">
            {product.discount_percentage > 0 ? (
              <>
                <span
                  className="original-price"
                  style={{ textDecoration: "line-through", color: "gray" }}
                >
                  {product.price} TL
                </span>
                <span className="discount-percentage" style={{ color: "red" }}>
                  {" "}
                  - {product.discount_percentage}%
                </span>
              </>
            ) : null}
          </p>
          <p
            className="discounted-price"
            style={{ color: product.discount_percentage > 0 ? "green" : "black" }}
          >
            {(
              product.price * (1 - product.discount_percentage / 100)
            ).toFixed(2)}{" "}
            TL
          </p>

          {/* Success and error messages */}
          {successMessage && (
            <p className="success-message" style={{ color: "green" }}>
              {successMessage}
            </p>
          )}
          {outOfStockMessage && (
            <p className="out-of-stock-message" style={{ color: "red" }}>
              {outOfStockMessage}
            </p>
          )}
          {/* Additional Informations */}
          <div className="additional-details">
            <p><strong>Model:</strong> {product.model}</p>
            <p><strong>Serial Number:</strong> {product.serial_number}</p>
            <p><strong>Warranty Status:</strong> {product.warranty_status ? 'Yes' : 'No'}</p>
            <p><strong>Distributor:</strong> {product.distributor}</p>
          </div>

          {/* Size Selection */}
          <div className="size-selection">
            <h4>Size:</h4>
            <div className="sizes">
              {product.colors
                .find((c) => c.color_name === selectedColor)
                ?.sizes.map((size) => (
                  <button
                    key={size.size_name}
                    onClick={() => setSelectedSize(size.size_name)}
                    className={`size-option ${
                      selectedSize === size.size_name ? "selected" : ""
                    }`}
                  >
                    {size.size_name} ({size.stock})
                  </button>
                ))}
            </div>
          </div>


          {/* Color Selection */}
          <div className="color-selection">
            <h4>Color:</h4>
            <div className="color-options">
              {product.colors.map((color) => (
                <div
                  key={color.color_name}
                  className={`color-option ${
                    selectedColor === color.color_name ? "selected" : ""
                  }`}
                  onClick={() => setSelectedColor(color.color_name)}
                  style={{
                    display: "inline-block",
                    padding: "5px",
                    margin: "5px",
                    cursor: "pointer",
                    border:
                      selectedColor === color.color_name
                        ? "2px solid black"
                        : "1px solid #ccc",
                    borderRadius: "50%",
                    width: "25px",
                    height: "25px",
                    backgroundColor: color.color_name,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div>
            <button
              className="add-to-cart"
              onClick={addToCart}
              disabled={isAddToCartDisabled}
            >
              Add to Cart
            </button>

            <button
              className="add-to-wishlist"
              onClick={addToWishlist}
              disabled={!selectedSize || !selectedColor}
            >
              ❤
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="comments-section">
        <h3>Customer Reviews</h3>
        <div className="comments-container">
          {product.comments.map((comment) => (
            <div key={comment.comment_id} className="comment">
              <p>
                <strong>Customer ID:</strong> {comment.customer_id}
              </p>
              <p>{comment.content}</p>
              <p>
                <em>{comment.created_at}</em>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailedProductPage;
