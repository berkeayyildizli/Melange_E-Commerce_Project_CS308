import React, { useState, useEffect } from 'react';
import './navbar.css';
import { FaBars, FaSearch, FaShoppingBag, FaUserAlt, FaHeart } from 'react-icons/fa';
import SignIn from '../Authenticaton/signinpage';
import ShoppingBagPage from '../Shopingbag/shopingbagpage';
import { useNavigate } from 'react-router-dom';
import { verifyToken } from './utilities';
import logo from './logo.png'; // Import your logo image

const Navbar = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showBag, setShowBag] = useState(false);
  const [showWish, setWish] = useState(false);
  const [bagCount, setBagCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const updateBagCount = () => {
      try {
        const savedBag = JSON.parse(localStorage.getItem('shoppingBag')) || [];
        const totalItems = savedBag.reduce((count, item) => count + (item.quantity || 1), 0);
        setBagCount(totalItems);
      } catch (error) {
        console.error('Error parsing shopping bag from localStorage:', error);
        setBagCount(0); // Reset to 0 in case of errors
      }
    };

    updateBagCount(); // Update on initial render

    const handleShoppingBagUpdate = () => {
      updateBagCount(); // Update the bag count when the event is triggered
    };

    // Listen for the custom event dispatched from DetailedProductPage
    window.addEventListener('shoppingBagUpdated', handleShoppingBagUpdate);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('shoppingBagUpdated', handleShoppingBagUpdate);
    };
  }, []);

  const toggleSignIn = async () => {
    if (showSignIn) {
      setShowSignIn(false);
      return;
    }

    const { valid } = await verifyToken(); // Destructure the `valid` property
    if (valid) {
      navigate('/account'); // Navigate if the token is valid
    } else {
      setShowSignIn(true); // Show the sign-in form if the token is invalid
    }
  };

  const toggleBag = () => {
    setShowBag(!showBag);
  };

  const toggleWish = async () => {
    if (!showWish) {
      // If wishlist is not already shown
      const isValid = await verifyToken(); // Await the token validation
      if (isValid) {
        navigate('/wishlist'); // Navigate if the token is valid
        setWish(true); // Show the wishlist
      } else {
        setWish(false); // Hide the wishlist if token is invalid
      }
    } else {
      setWish(false); // Hide the wishlist if it is already shown
    }
  };

  // Debounce function to improve search performance

  return (
    <>
      <nav className="navbarcomp_navbar">
        <div className="navbarcomp_navbar-left">
          <a href="/category?category_gender=Men" className="navbar-link">
            Men
          </a>
          <a href="/category?category_gender=Women" className="navbar-link">
            Women
          </a>
          <a href="/category?category_gender=Teen" className="navbar-link">
            Teen
          </a>
        </div>

        <div className="navbarcomp_navbar-center">
          {/* Replace LOGO text with the logo image */}
          <img onClick={() => navigate('/')} src={logo} alt="Company Logo" className="navbar-logo"/>
        </div>

        <div className="navbarcomp_navbar-right">
          <FaUserAlt className="navbarcomp_signin-icon" onClick={toggleSignIn} />
          <div className="shoppingBag" onClick={toggleBag}>
            <FaShoppingBag className="navbarcomp_bag-icon" />
            {bagCount > 0 && <span className="bag_counter">{bagCount}</span>}
          </div>
          <div className="wishlist" onClick={toggleWish}>
            <FaHeart className="navbarcomp_bag-icon" />
            {wishCount > 0 && <span className="wishlist_counter">{wishCount}</span>}
          </div>
        </div>
      </nav>

      {showSignIn && <SignIn toggleSignIn={toggleSignIn} />}
      {showBag && <ShoppingBagPage onClose={toggleBag} />}
    </>
  );
};

export default Navbar;