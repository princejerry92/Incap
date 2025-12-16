import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './global-styles.css';
import AppRouter from './AppRouter';
import NetworkError from './NetworkError';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

// State to manage network error display
let showNetworkError = false;

const renderApp = () => {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        {showNetworkError ? <NetworkError /> : <AppRouter />}
      </BrowserRouter>
    </React.StrictMode>
  );
};

// Listen for network error events
window.addEventListener('network:error', () => {
  showNetworkError = true;
  renderApp();
});

// Listen for successful network recovery (optional, can be triggered by retry)
window.addEventListener('network:recovered', () => {
  showNetworkError = false;
  renderApp();
});

// Initial render
renderApp();

reportWebVitals();
