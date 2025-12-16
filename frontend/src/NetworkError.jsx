import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NetworkError.css'; // We'll create this CSS file

const NetworkError = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    // Dispatch event to hide network error and reload
    window.dispatchEvent(new CustomEvent('network:recovered'));
    window.location.reload(); // Reload the page to retry
  };

  return (
    <div className="error-page network-error">
      <div className="error-content">
        <h1>Network Error</h1>
        <h2>Connection Failed</h2>
        <p>Unable to connect to the server. Please check your internet connection and try again.</p>
        <button onClick={handleRetry} className="error-button">
          Retry
        </button>
      </div>
    </div>
  );
};

export default NetworkError;
