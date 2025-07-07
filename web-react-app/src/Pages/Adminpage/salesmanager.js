import React, { useState } from 'react';
import './salesmanager.css'; // Updated CSS file for Sales Manager
import PriceManagment from './salesMpages/pricemanager'; 
import DiscountManagment from './salesMpages/discountmanagment'; 
import InvoiceView from './salesMpages/viewinvoices'; 
import RevenueCalculation from './salesMpages/revenuecalculation'; 
import RefundApproval from './salesMpages/refundmanager'; // Import the enhanced OrderApproval component

const SalesManagerPage = () => {
  const [activeComponent, setActiveComponent] = useState('main');

  const renderContent = () => {
    switch (activeComponent) {
      case 'PriceManagment':
        return <PriceManagment />;
      case 'DiscountManagment':
        return <DiscountManagment />;
      case 'InvoiceView':
        return <InvoiceView />;
      case 'RevenueCalculation':
        return <RevenueCalculation />;
      case 'refundApproval':
        return <RefundApproval />;
      default:
        return <MainContent setActiveComponent={setActiveComponent} />;
    }
  };

  return (
    <div className="salesM-page">
      <div className="salesM-sidebar">
        <h2>Sales Manager</h2>
        <button
          className="salesM-button"
          onClick={() => setActiveComponent('main')}
        >
          Main Content
        </button>
        <button
          className="salesM-button"
          onClick={() => setActiveComponent('PriceManagment')}
        >
          Price Management
        </button>
        <button
          className="salesM-button"
          onClick={() => setActiveComponent('DiscountManagment')}
        >
          Discount Management
        </button>
        <button
          className="salesM-button"
          onClick={() => setActiveComponent('InvoiceView')}
        >
          View Invoices
        </button>
        <button
          className="salesM-button"
          onClick={() => setActiveComponent('RevenueCalculation')}
        >
          Revenue Calculation
        </button>
        <button
          className="salesM-button"
          onClick={() => setActiveComponent('refundApproval')}
        >
          Refund Approval
        </button>
      </div>
      <div className="salesM-content">{renderContent()}</div>
    </div>
  );
};

const MainContent = ({ setActiveComponent }) => (
  <div className="salesM-section">
    <h2>Main Content</h2>
    <p>Select an action below to view the corresponding section:</p>
    <div className="salesM-button-group">
      <button
        className="salesM-button"
        onClick={() => setActiveComponent('PriceManagment')}
      >
        Price Management
      </button>
      <button
        className="salesM-button"
        onClick={() => setActiveComponent('DiscountManagment')}
      >
        Discount Management
      </button>
      <button
        className="salesM-button"
        onClick={() => setActiveComponent('InvoiceView')}
      >
        View Invoices
      </button>
      <button
        className="salesM-button"
        onClick={() => setActiveComponent('RevenueCalculation')}
      >
        Revenue Calculation
      </button>
      <button
        className="salesM-button"
        onClick={() => setActiveComponent('refundApproval')}
      >
        Refund Approval
      </button>
    </div>
  </div>
);

export default SalesManagerPage;
