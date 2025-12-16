import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css'; // We'll create this CSS file

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="error-page not-found">
      <div className="error-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <button onClick={handleGoBack} className="error-button">
          Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
