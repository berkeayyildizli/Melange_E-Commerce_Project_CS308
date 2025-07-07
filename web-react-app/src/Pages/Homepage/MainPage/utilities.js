// Verify the user's token
export const verifyToken = async () => {
  const token = localStorage.getItem('token');
  if (!token) return { valid: false, message: "No token present" };

  try {
      const response = await fetch('/auth/decode-token', {
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
          return { valid: true, payload: data.payload, message: "Token is valid" };
      } else {
          localStorage.removeItem('token');
          return { valid: false, message: data.message || "Invalid token" };
      }
  } catch (error) {
      console.error('Error verifying token:', error);
      localStorage.removeItem('token');
      return { valid: false, message: "Error verifying token" };
  }
};

export const verifyAdminToken = async () => {
    const adminToken = localStorage.getItem('adminToken'); // Retrieve token from localStorage
  
    if (!adminToken) {
      return { valid: false, message: "No token found in localStorage" };
    }
  
    try {
      // Send a POST request to the decode-token endpoint
      const response = await fetch('http://localhost:8000/adminAuth/decode-token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminToken }), // Send the token in the request body
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        return { valid: false, message: errorData.message || "Token verification failed" };
      }
  
      const data = await response.json();
  
      if (data.status === 'success') {
        return { valid: true, payload: data.payload }; // Return the decoded payload
      } else {
        return { valid: false, message: data.message || "Invalid token" };
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      return { valid: false, message: "Error communicating with the server" };
    }
  };

// Load shopping bag from localStorage or server
export const loadShoppingBag = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
      // Load from localStorage if no token
      return JSON.parse(localStorage.getItem('shoppingBag')) || [];
  } else {
      try {
          const response = await fetch('/shoppingCart/view', {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json',
              },
          });

          const data = await response.json();

          if (response.ok && data.status === 'success') {
              return Array.isArray(data.cart_items) ? data.cart_items : [];
          } else {
              console.error('Error loading shopping bag from server:', data.message);
              return [];
          }
      } catch (error) {
          console.error('Error fetching shopping bag:', error);
          return [];
      }
  }
};

// Save shopping bag to localStorage
export const saveShoppingBag = (shoppingBag) => {
  localStorage.setItem('shoppingBag', JSON.stringify(shoppingBag));
};

// Add an item to the shopping bag
export const addItemToBag = async (shoppingBag, item) => {
  const token = localStorage.getItem('token');
  if (token) {
      try {
          const response = await fetch('/shoppingCart/add', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  base_product_id: item.product_id,
                  color_name: item.color_name,
                  size_name: item.size_name,
                  shopping_quantity: item.quantity,
              }),
          });

          const result = await response.json();

          if (response.ok && result.status === 'success') {
              console.log(result.message);
              return shoppingBag; // No need to update localStorage if server is used
          } else {
              console.error('Failed to add item to server cart:', result.message);
          }
      } catch (error) {
          console.error('Error adding item to server cart:', error);
      }
  }
  const availableStock = item.product_stock || 0;

  // Ensure the quantity doesn't exceed available stock
  const adjustedQuantity = Math.max(1, Math.min(item.quantity, availableStock));
  // If no token or server failure, update local storage
  const existingItemIndex = shoppingBag.findIndex(
      (bagItem) =>
          bagItem.product_id === item.product_id &&
          bagItem.color_name === item.color_name &&
          bagItem.size_name === item.size_name
  );

  if (existingItemIndex !== -1) {
      shoppingBag[existingItemIndex].quantity += adjustedQuantity;
  } else {
      shoppingBag.push({
          product_id: item.product_id,
          product_name: item.product_name,
          color_name: item.color_name,
          size_name: item.size_name,
          quantity: adjustedQuantity,
          price: item.price,
          product_stock: availableStock,
      });
  }

  saveShoppingBag(shoppingBag);
  return shoppingBag;
};

// Remove an item from the shopping bag
export const removeItemFromBag = async (shoppingBag, item) => {
  const token = localStorage.getItem('token');

  if (token) {
      try {
          const response = await fetch('/shoppingCart/remove', {
              method: 'DELETE',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  base_product_id: item.product_id,
                  color_name: item.color_name,
                  size_name: item.size_name,
              }),
          });

          const result = await response.json();

          if (response.ok && result.status === 'success') {
              console.log(result.message);
              // Return the updated bag after fetching it from the server
              return await loadShoppingBag();
          } else {
              console.error('Error removing item from cart:', result.message);
              return shoppingBag; // Return the current bag in case of failure
          }
      } catch (error) {
          console.error('Error removing item from cart:', error);
          return shoppingBag; // Return the current bag in case of error
      }
  } else {
      // Local storage management
      const updatedBag = shoppingBag.filter(
          (bagItem) =>
              !(
                  bagItem.product_id === item.product_id &&
                  bagItem.color_name === item.color_name &&
                  bagItem.size_name === item.size_name
              )
      );
      saveShoppingBag(updatedBag);
      return updatedBag;
  }
};

// Update the quantity of an item in the shopping bag
export const updateItemQuantity = async (shoppingBag, item, newQuantity) => {
    const token = localStorage.getItem('token');
    const adjustedQuantity = Math.max(1, Math.min(newQuantity, item.product_stock || 0));
    console.log("updateItemQuantity:",adjustedQuantity);

    if (token) {
        try {
            const response = await fetch('/shoppingCart/update', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    base_product_id: item.product_id,
                    color_name: item.color_name,
                    size_name: item.size_name,
                    shopping_quantity: adjustedQuantity,
                }),
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                console.log(result.message);
                // Return the updated bag after fetching it from the server
                return await loadShoppingBag();
            } else {
                console.error('Error updating item quantity:', result.message);
                return shoppingBag; // Return the current bag in case of failure
            }
        } catch (error) {
            console.error('Error updating item quantity:', error);
            return shoppingBag; // Return the current bag in case of error
        }
    } else {
        // Local storage management
        const updatedBag = shoppingBag.map((bagItem) =>
            bagItem.product_id === item.product_id &&
            bagItem.color_name === item.color_name &&
            bagItem.size_name === item.size_name
                ? { ...bagItem, quantity: adjustedQuantity }
                : bagItem
        );
        if (adjustedQuantity === 0) {
            return await removeItemFromBag(shoppingBag, item);
        }
        saveShoppingBag(updatedBag);
        return updatedBag;
    }
};

// Sync local shopping bag to the server when user logs in
export const syncLocalBagToServer = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
      console.error('User not logged in');
      return;
  }

  try {
      const localBag = JSON.parse(localStorage.getItem('shoppingBag')) || [];

      if (localBag.length === 0) {
          console.log('No items in the local shopping bag to sync.');
          return;
      }

      const response = await fetch('/shoppingCart/add-batch', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ shoppingBag: localBag }),
      });

      const result = await response.json();
      if (response.ok && result.status === 'success') {
          console.log('Local shopping bag synced with the server successfully.');
          localStorage.removeItem('shoppingBag');
      } else {
          console.error('Failed to sync shopping bag:', result.message);
      }
  } catch (error) {
      console.error('Error syncing local shopping bag to server:', error);
  }
};
