import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './FAQ.css';
import logo from './logo.png'; // Import the logo image

const FAQ = () => {
  const [openItem, setOpenItem] = useState(null); // Track which item is open

  const toggleItem = (index) => {
    setOpenItem(openItem === index ? null : index); // Toggle the clicked item
  };

  const faqs = [
    {
      question: 'Is Mèlange a real online store?',
      answer: 'No, Mèlange is a project website created for demonstration purposes. It’s not a real store, and no actual purchases can be made.',
    },
    {
      question: 'Can I buy products from this website?',
      answer: 'No, all the products listed on this website are for showcasing purposes only. There are no real transactions or shipping services.',
    },
    {
      question: 'Who developed this website?',
      answer: (
        <>
          This website was developed as part of a Software Engineering course, focusing on solving real-world software engineering problems and applying systematic methodologies.
          It showcases not just web development skills but also principles like requirements analysis, design patterns, testing strategies, and project management.
          You can find more details about the developers and their contact information on the <Link to="/contact">Contact</Link> page.
        </>
      ),
    },
    {
      question: 'Can I contact customer support?',
      answer: (
        <>
          Since this is not a real store, there’s no customer support available. However, feel free to reach out to the developers via the <Link to="/contact">Contact</Link> page for questions about the project.
        </>
      ),
    },
  ];

  return (
    <div className="faq-page">
      {/* Header with logo */}
      <header className="faq-header">
        <Link to="/" className="logo-link">
          <img
            src={logo} // Use the imported logo
            alt="Mèlange Logo"
            className="faq-logo"
          />
        </Link>
      </header>

      {/* FAQ Content */}
      <div className="faq-container">
        <h1>Frequently Asked Questions (FAQ)</h1>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${openItem === index ? 'open' : ''}`}
              onClick={() => toggleItem(index)}
            >
              <h2 className="faq-question">{faq.question}</h2>
              <div
                className="faq-answer"
                style={{
                  maxHeight: openItem === index ? '500px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                }}
              >
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
