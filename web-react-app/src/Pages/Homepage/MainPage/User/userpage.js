import React, { useEffect, useState } from 'react';
import './userpage.css';
import MyOrders from './myorders';
import MyComments from './mycomments';
import MyRefunds from './myrefunds';

const UserPage = () => {
  const [activeTab, setActiveTab] = useState('myOrders');
  const [userInfo, setUserInfo] = useState(null); // Store user details //
  const [error, setError] = useState('');//


  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('User is not authenticated');

        const response = await fetch('/account/user', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (data.status === 'success') {
          setUserInfo(data.user);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <div className="account-page">
      <div className="account-header">
        {userInfo ? (
          <>
            <h1>Welcome, {userInfo.name} {userInfo.surname}</h1>
            <p>Email: {userInfo.email}</p>
            <p>Address: {userInfo.home_address}</p>
            <p>Tax ID: {userInfo.tax_id}</p>
          </>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <p>Loading user information...</p>
        )}
      </div>
      <div className="account-tabs">
        <button onClick={() => window.location.href = '/'}>Go Back</button>
        <button className={activeTab === 'myOrders' ? 'active' : ''} onClick={() => handleTabChange('myOrders')}>
          My Orders
        </button>
        <button className={activeTab === 'myRefunds' ? 'active' : ''} onClick={() => handleTabChange('myRefunds')}>
          My Refunds
        </button>
        <button className={activeTab === 'myComments' ? 'active' : ''} onClick={() => handleTabChange('myComments')}>
          My Comments
        </button>

        <button onClick={handleLogout}>Logout</button>
      </div>
      <div className="account-content">
        {activeTab === 'myOrders' && <MyOrders />}
        {activeTab === 'myRefunds' && <MyRefunds />}
        {activeTab === 'myComments' && <MyComments />}
      </div>
    </div>
  );
};

export default UserPage;
