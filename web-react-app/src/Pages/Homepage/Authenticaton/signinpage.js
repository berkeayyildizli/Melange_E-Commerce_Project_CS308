import React, { useState } from 'react';
import './signinpage.css'; // Import your CSS file
import your_logo_path from "./logo.png"; // Adjust this path to your actual logo path
import { syncLocalBagToServer } from '../MainPage/utilities'; // Import utility functions

const SignInPage = ({ toggleSignIn }) => {
  const [isSignIn, setIsSignIn] = useState(true); // Toggle between Sign In and Sign Up
  const [rotate, setRotate] = useState(false); // State for rotation
  const [showAdditionalFields, setShowAdditionalFields] = useState(false); // State for additional fields
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [taxId, setTaxId] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [home_address, setAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Toggle between Sign In and Sign Up form
  const toggleForm = () => {
    setRotate(true); // Trigger rotation
    setIsSignIn((prev) => !prev); // Toggle between Sign In and Sign Up
    setShowAdditionalFields(false); // Reset additional fields
    setErrorMessage(''); // Reset error message
    setTimeout(() => setRotate(false), 400); // Duration matches the CSS animation
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    setShowAdditionalFields(true); // Show additional fields for registration
  };

  // Validate password match on the frontend
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
  
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please try again.");
      return;
    }
  
    // Combine city, district, and address into a single home_address string
    const address = `${home_address}, ${district}, ${city}`;

    console.log({
      name,
      surname,
      email,
      password,
      confirm_password: confirmPassword,
      tax_id: taxId,
      address,
    });

    // Make API request to register the user
    const response = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        surname,
        email,
        password,
        confirm_password: confirmPassword,
        tax_id: parseInt(taxId, 10),
        address, // Updated key to "address"
      }),
    });
  
    const data = await response.json();
    if (data.status === "success") {
      alert("You Have Succesfully Registered");
      setPassword('');
      setConfirmPassword('');
      setIsSignIn(true); // Switch back to sign-in after successful registration
    } else {
      setErrorMessage(data.message);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    // Make API request to login
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginData = { email, password };

    // Log the JSON object to the console
    console.log("Login Data:", loginData);

    const data = await response.json();
    if (data.status === "success") {
      localStorage.setItem("token", data.token);
      await syncLocalBagToServer();
      
      const event = new Event("shoppingBagUpdated");
      window.dispatchEvent(event);
      toggleSignIn(); // Close the modal
    } else {
      setErrorMessage(data.message);
    }
  };

  return (
    <div className="signin-modal-overlay" onClick={toggleSignIn}>
      <div className={`signin-modal-content ${rotate ? 'rotate' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={toggleSignIn}>&times;</button>
        
        <div className="sign-near">
          <img src={your_logo_path} className="signin-logo" alt="Logo" />
          <h1 className="signin-title">{isSignIn ? 'Sign In' : 'Sign Up'}</h1>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {isSignIn ? (
          <form className="signin-form" onSubmit={handleLoginSubmit}>
            <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="signin-input" />
            <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="signin-input" />
            <button type="submit" className="signin-button">Login Now</button>
          </form>
        ) : (
          <form className="signin-form" onSubmit={handleRegisterSubmit}>
            {!showAdditionalFields && (
              <>
                <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="signin-input" />
                <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="signin-input" />
                <input type="password" placeholder="Confirm Password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="signin-input" />
              </>
            )}

            {!showAdditionalFields ? (
              <button type="button" onClick={handleRegisterClick} className="signin-button">
                Register Now
              </button>
            ) : (
              <>
                <input type="text" placeholder="Name" required value={name} onChange={(e) => setName(e.target.value)} className="signin-input" />
                <input type="text" placeholder="Surname" required value={surname} onChange={(e) => setSurname(e.target.value)} className="signin-input" />
                <input type="text" placeholder="Tax ID" required value={taxId} onChange={(e) => setTaxId(e.target.value)} className="signin-input" />
                <input type="text" placeholder="City" required value={city} onChange={(e) => setCity(e.target.value)} className="signin-input" />
                <input type="text" placeholder="District" required value={district} onChange={(e) => setDistrict(e.target.value)} className="signin-input" />
                <input type="text" placeholder="Address" required value={home_address} onChange={(e) => setAddress(e.target.value)} className="signin-input" />
                <button type="submit" className="signin-button">Complete Registration</button>
              </>
            )}
          </form>
        )}

        <p className="signin-footer">
          {isSignIn ? "Don't have an account?" : "Already have an account?"}
          <button onClick={toggleForm} className="toggle-button">
            {isSignIn ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignInPage;
