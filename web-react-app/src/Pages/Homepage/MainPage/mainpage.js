import React from 'react';
import './mainpage.css';
import menbackground from "./MenCatogary.jpeg";
import womenbackground from "./WomenCatogary.jpeg";
import kidbackground from "./KidsCatogary.jpeg";
import logo from "./logo.png"; // Import the logo image
import { Link } from 'react-router-dom';

const MainPage = () => {
  return (
    <div className="mainpage">
      <header className="mainpage__header">
        {/* Replace the title with the logo */}
        <img src={logo} alt="OurShop Logo" className="mainpage__logo" />
      </header>

      <div className="mainpage__categories">
        {/* Women's Category */}
        <Link to="/category?category_gender=Women" className="category category--women">
          <img 
            src={womenbackground}
            alt="Women Category" 
            className="category__image" 
          />
          <div className="category__info">
            <h2 className="category__title">Women</h2>
          </div>
        </Link>

        {/* Men's Category */}
        <Link to="/category?category_gender=Men" className="category category--men">
          <img 
            src={menbackground}
            alt="Men Category" 
            className="category__image" 
          />
          <div className="category__info">
            <h2 className="category__title">Men</h2>
          </div>
        </Link>

        {/* Teen's Category */}
        <Link to="/category?category_gender=Teen" className="category category--teen">
          <img 
            src={kidbackground}
            alt="Teen Category" 
            className="category__image" 
          />
          <div className="category__info">
            <h2 className="category__title">Teen</h2>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default MainPage;
