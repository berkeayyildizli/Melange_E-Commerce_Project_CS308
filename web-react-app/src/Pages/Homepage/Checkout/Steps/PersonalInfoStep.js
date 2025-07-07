import React, { useEffect } from "react";

const PersonalInfoStep = ({ personalInfo, setPersonalInfo, onNext, onBack }) => {
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("User not logged in.");
        return;
      }

      try {
        const response = await fetch("/checkout/user-info", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok && data.status === "success") {
          const { name, surname, address, email } = data.user_info;
          setPersonalInfo({ name, surname, address, email });
        } else {
          console.error("Error fetching user info:", data.message);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, [setPersonalInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo({ ...personalInfo, [name]: value });
  };

  return (
    <div className="checkout-step">
      <h2>Enter Personal Information</h2>
      <form>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={personalInfo.name || ""}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="surname"
          placeholder="Surname"
          value={personalInfo.surname || ""}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={personalInfo.address || ""}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={personalInfo.email || ""}
          onChange={handleChange}
          required
        />
      </form>
      <div className="step-buttons">
        <button onClick={onBack} className="back-button">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={
            !personalInfo.name ||
            !personalInfo.surname ||
            !personalInfo.address ||
            !personalInfo.email
          }
          className="next-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PersonalInfoStep;


