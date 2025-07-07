import { useEffect, useState } from 'react';
import { verifyAdminToken } from '../Homepage/MainPage/utilities';
import ProductManagerPage from './productmanager'; // Import the ProductManagerPage component
import SalesManagerPage from './salesmanager'; // Import the SalesManager component

const AdminPage = () => {
  const [role, setRole] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      const result = await verifyAdminToken();
      console.log(result);
      if (result.valid) {
        setRole(result.payload.role); // Assuming the role is returned in the response
      } else {
        setMessage(result.message); // Show message from verifyAdminToken
        setTimeout(() => {
          window.location.href = '/admin_login'; // Redirect to login
        }, 2000); // Redirect after 2 seconds
      }
    };

    validateToken();
  }, []);

  return (
    <div>
      {role === 'salesManager' ? (
            <SalesManagerPage />
      ) : role === 'productManager' ? (
            <ProductManagerPage /> // Render ProductManagerPage if the role is productManager
      ) : message ? (
        <h1>{message}</h1>
      ) : (
        <h1>Loading...</h1>
      )}
    </div>
  );
};

export default AdminPage;
