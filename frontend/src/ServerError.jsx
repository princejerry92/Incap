import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ServerError.css'; // We'll create this CSS file

const ServerError = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    window.location.reload(); // Reload the page to retry
  };

  return (
    <div className="error-page server-error">
      <div className="error-content">
        <h1>505</h1>
        <h2>Internal Server Error</h2>
        <p>Something went wrong on our end. Please try again.</p>
        <button onClick={handleRetry} className="error-button">
          Retry
        </button>
      </div>
    </div>
  );
};

export default ServerError;
