import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './Pages/Homepage/MainPage/mainpage.js';
import Footer from './Pages/Homepage/MainPage/Footer.js'; // Import Footer
import Purchase from './Pages/Homepage/Purchasepage/purchasepage.js';
import './App.css';
import Detailedproductpage from './Pages/Homepage/Detailedproductpage/detailedproductpage.js';
import ShoppingBagPage from './Pages/Homepage/Shopingbag/shopingbagpage.js';
import CategoryPage from './Pages/Homepage/Categorypage/CategoryPage.js';
import Checkout from './Pages/Homepage/Checkout/checkout.js';
import AdminLogin from './Pages/Adminpage/adminlogin.js';
import AdminPage from './Pages/Adminpage/adminpage.js';
import UserPage from './Pages/Homepage/MainPage/User/userpage.js';
import AboutUs from "./Pages/Homepage/StaticPages/AboutUs";
import FAQ from "./Pages/Homepage/StaticPages/FAQ";
import Contact from "./Pages/Homepage/StaticPages/Contact";
import WishlistPage from "./Pages/Homepage/WishlistPage/wishlist";

const App = () => {
  return (
    <Router>
      <div className="app">
        <div className="routes-container">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/purchase_now" element={<Purchase />} />
            <Route path='/product_page' element={<Detailedproductpage/>}/>
            <Route path='/shoping_bag' element={<ShoppingBagPage/>}/>
            <Route path='/checkout' element={<Checkout/>}/>
            <Route path='/account' element={<UserPage/>}/>
            <Route path='/admin_login' element={<AdminLogin/>}/>
            <Route path='/admin_page' element={<AdminPage/>}/>
            <Route path='/about' element={<AboutUs/>}/>
            <Route path='/faq' element={<FAQ/>}/>
            <Route path='/contact' element={<Contact/>}/>
            <Route path='/wishlist' element={<WishlistPage/>}/>

          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
