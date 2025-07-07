import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Contact.css';
import logo from './logo.png'; // Import the logo image

const developers = [
  {
    name: 'Berke Ayyıldızlı',
    email: 'developer1@example.com',
    linkedIn: 'https://linkedin.com/in/developer1',
    photo: './photos/berke.jpg',
    cvFile: '/CVs/BerkeAyyildizli_CV.pdf',
  },
  {
    name: 'Beyza Balota',
    email: 'developer2@example.com',
    linkedIn: 'https://linkedin.com/in/developer2',
    photo: './photos/beyza.jpg',
    cvFile: '/CVs/BeyzaBalota_CV.pdf',
  },
  {
    name: 'Göktuğ Gökyılmaz',
    email: 'developer3@example.com',
    linkedIn: 'https://linkedin.com/in/developer3',
    photo: './photos/goktug.jpg',
    cvFile: '/CVs/GoktugGokyilmaz_CV.pdf',
  },
  {
    name: 'Kerem Tatari',
    email: 'keremtatari@sabanciuniv.edu',
    linkedIn: 'https://linkedin.com/in/kerem-tatari',
    photo: './photos/kerem.jpg',
    cvFile: '/CVs/KeremTatari_CV.pdf', // Link to the PDF CV
  },
  {
    name: 'Kerem Tuğrul Enünlü',
    email: 'developer5@example.com',
    linkedIn: 'https://linkedin.com/in/developer5',
    photo: './photos/tugrul.jpg',
    cvFile: '/CVs/KeremTugrulEnunlu_CV.pdf',
  },
  {
    name: 'Osman Berk An',
    email: 'developer6@example.com',
    linkedIn: 'https://linkedin.com/in/developer6',
    photo: './photos/osman.jpg',
    cvFile: '/CVs/OsmanBerkAn_CV.pdf',
  },
];

const Contact = () => {
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);

  const handlePhotoClick = (developer) => {
    setSelectedDeveloper(developer);
  };

  const handleCloseModal = (e) => {
    if (e.target.classList.contains('modal')) {
      setSelectedDeveloper(null);
    }
  };

  return (
    <div className="contact-page">
      {/* Header with logo */}
      <header className="contact-header">
        <Link to="/" className="logo-link">
          <img src={logo} alt="Mèlange Logo" className="contact-logo" />
        </Link>
      </header>

      {/* Contact Content */}
      <div className="contact-container">
        <h1>Contact Us</h1>
        <p>
          We’d love to hear from you! If you have any questions or feedback
          about this project, feel free to reach out to the developers listed below:
        </p>

        {/* Developer Grid */}
        <div className="developer-grid">
          {developers.map((dev, index) => (
            <div
              key={index}
              className="developer-card"
              onClick={() => handlePhotoClick(dev)}
            >
              <img src={dev.photo} alt={dev.name} className="developer-photo" />
              <h2 className="developer-name">{dev.name}</h2>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for CV, Contact Info, and Photo */}
      {selectedDeveloper && (
        <div className="modal" onClick={handleCloseModal}>
          <div className="modal-content">
            <span className="close-button" onClick={() => setSelectedDeveloper(null)}>
              &times;
            </span>
            <img
              src={selectedDeveloper.photo}
              alt={selectedDeveloper.name}
              className="modal-photo"
            />
            <h2>{selectedDeveloper.name}</h2>
            <p><strong>Email:</strong> {selectedDeveloper.email}</p>
            <p>
              <strong>LinkedIn:</strong>{' '}
              <a href={selectedDeveloper.linkedIn} target="_blank" rel="noopener noreferrer">
                {selectedDeveloper.linkedIn}
              </a>
            </p>
            <p>
              <strong>CV:</strong>{' '}
              <a href={selectedDeveloper.cvFile} target="_blank" rel="noopener noreferrer">
                Open CV (PDF)
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
