import React, { useState } from 'react';
import './productmanager.css';
import OrderApproval from './productMpages/ordermanagment'; // Import the enhanced OrderApproval component
import StatusManager from './productMpages/statusmanagment'; // Import the enhanced OrderApproval component
import CommentApproval from './productMpages/commentmanager'; // Import the enhanced OrderApproval component
import ProductManagement from './productMpages/productmanagment';
import CategoryManagement from './productMpages/categorymanagment';
import RemoveManagement from "./productMpages/removemanagement";
import StockManagement from "./productMpages/stockmanagement";
import PhotoManagement from './productMpages/photomanagement';


const ProductManagerPage = () => {
  const [activeComponent, setActiveComponent] = useState('main');

  const renderContent = () => {
    switch (activeComponent) {
      case 'orderApproval':
        return <OrderApproval />;
      case 'statusChange':
        return <StatusManager />;
      case 'commentApproval':
        return <CommentApproval />;
      case 'productManagement':
        return <ProductManagement />;
      case 'removeManagement':
        return <RemoveManagement />;
      case 'stockManagement':
        return <StockManagement />;
      case 'categoryManagement':
        return <CategoryManagement />;
      case 'photoManagement':
        return <PhotoManagement />;
      default:
        return <MainContent setActiveComponent={setActiveComponent} />;
    }
  };

  return (
    <div className="productM-page">
      <div className="productM-sidebar">
        <h2>Product Manager</h2>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('main')}
        >
          Main Content
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('orderApproval')}
        >
          Order Approval
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('statusChange')}
        >
          Status Change
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('commentApproval')}
        >
          Comment Approval
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('productManagement')}
        >
          Create Product
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('removeManagement')}
        >
          Remove Product
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('stockManagement')}
        >
          Stock Update
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('categoryManagement')}
        >
          Category Add/Remove
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('photoManagement')}
        >
          Photo Management
        </button>
      </div>
      <div className="productM-content">{renderContent()}</div>
    </div>
  );
};

const MainContent = ({setActiveComponent}) => (
    <div className="productM-section">
    <h2>Main Content</h2>
    <p>Select an action below to view the corresponding section:</p>
      <div className="productM-button-group">
        <button
            className="productM-button"
            onClick={() => setActiveComponent('orderApproval')}
        >
          Order Approval
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('statusChange')}
        >
          Status Change
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('commentApproval')}
        >
          Comment Approval
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('productManagement')}
        >
          Create Product
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('removeManagement')}
        >
          Remove Product
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('stockManagement')}
        >
          Stock Update
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('categoryManagement')}
        >
          Category Add/Remove
        </button>
        <button
            className="productM-button"
            onClick={() => setActiveComponent('photoManagement')}
        >
          Photo Management
        </button>
      </div>
    </div>
);


export default ProductManagerPage;
