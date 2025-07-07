import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./wishlist.css"; // Ensure you have the CSS file for styling

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([]); // Wishlist state
  const navigate = useNavigate(); // For navigation

  // Fetch wishlist data from the backend
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await fetch("/wishlist/view", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.status === "success") {
            setWishlistItems(data.wishlist);
            // Each item should have:
            // product_price, discount_percentage, discounted_price, color_name, size_name, added_date
          } else {
            console.error("Failed to fetch wishlist items:", data.message);
          }
        } else {
          console.error("Failed to fetch wishlist items.");
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      }
    };

    fetchWishlist();
  }, []);

  // Handle removing an item from the wishlist
  const handleRemove = async (baseProductId, colorName, sizeName) => {
    try {
      const response = await fetch("/wishlist/remove", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base_product_id: baseProductId,
          color_name: colorName,
          size_name: sizeName,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          // Update the wishlist state to remove the deleted item
          setWishlistItems((prevItems) =>
            prevItems.filter(
              (item) =>
                !(
                  item.product_id === baseProductId &&
                  item.color_name === colorName &&
                  item.size_name === sizeName
                )
            )
          );
        } else {
          console.error("Failed to remove item from wishlist:", data.message);
        }
      } else {
        console.error("Failed to remove item from wishlist.");
      }
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
    }
  };

  // Navigate to the product page
  const handleItemClick = (productId) => {
    navigate(`/product_page?product_id=${productId}`);
  };

  return (
    <div className="wishlist-page">
      <button
        className="wishlist-go-back-btn"
        onClick={() => navigate(-1)} // Go back to the previous page
      >
        Go Back
      </button>
      <h1 className="wishlist-title">My Wishlist</h1>
      <div className="wishlist-items-container">
        {wishlistItems.length > 0 ? (
          wishlistItems.map((item) => (
            <div
              key={`${item.product_id}-${item.color_name}-${item.size_name}`}
              className="wishlist-item"
              onClick={() => handleItemClick(item.product_id)}
            >
              <img
                src={item.image_url}
                alt={`${item.product_name} (${item.color_name})`}
                className="wishlist-item-image"
              />
              <h3>{item.product_name}</h3>

              {/* Discount Handling */}
              {item.discount_percentage > 0 ? (
                <>
                  {/* Original Price crossed out */}
                  <p style={{ textDecoration: "line-through", color: "gray" }}>
                    {item.product_price.toFixed(2)} TL
                  </p>
                  {/* Discount Percentage in red */}
                  <p style={{ color: "red" }}>
                    - {item.discount_percentage.toFixed(2)}%
                  </p>
                  {/* Discounted Price in green */}
                  <p style={{ color: "green", fontWeight: "bold" }}>
                    {item.discounted_price.toFixed(2)} TL
                  </p>
                </>
              ) : (
                // If no discount, show the normal price in bold
                <p style={{ fontWeight: "bold" }}>
                  {item.product_price.toFixed(2)} TL
                </p>
              )}

              {/* Show color, size, and date */}
              <p>Color: {item.color_name}</p>
              <p>Size: {item.size_name}</p>
              <p>Added: {new Date(item.added_date).toLocaleString()}</p>

              <button
                className="wishlist-remove-btn"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent navigation when clicking "Remove"
                  handleRemove(item.product_id, item.color_name, item.size_name);
                }}
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <p>Your wishlist is empty.</p>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
