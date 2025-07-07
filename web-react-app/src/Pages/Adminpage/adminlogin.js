import React, { useState } from 'react';
import './adminlogin.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // Success message state
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    // Validate inputs
    if (!username || !password) {
      setErrorMessage('Please fill in both fields.');
      setIsLoading(false);
      return;
    }

    try {
      // Send a POST request to the login API
      const response = await fetch('/adminAuth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);

        // Save the token and show success message
        localStorage.setItem('adminToken', data.token);
        setSuccessMessage('Login successful! Redirecting...');
        
        setTimeout(() => {
          window.location.href = '/admin_page'; // Redirect to login
        }, 2000); // 1.5 seconds delay
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setErrorMessage('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="adminlogin-page-wrapper">
      <div className="adminlogin-container">
        <h2 className="adminlogin-title">Admin Login</h2>
        <form className="adminlogin-form" onSubmit={handleLogin}>
          <div className="adminlogin-input-group">
            <label htmlFor="username" className="adminlogin-label">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="adminlogin-input"
              required
            />
          </div>
          <div className="adminlogin-input-group">
            <label htmlFor="password" className="adminlogin-label">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="adminlogin-input"
              required
            />
          </div>
          {errorMessage && (
            <div className="adminlogin-error">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="adminlogin-success">
              {successMessage}
            </div>
          )}
          <button
            type="submit"
            className="adminlogin-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
