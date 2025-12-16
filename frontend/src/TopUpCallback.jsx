import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dashboardAPI } from './services/api';

const TopUpCallback = () => {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Log the full URL for debugging
        console.log('Full callback URL:', window.location.href);
        console.log('Window location search:', window.location.search);

        // Get reference and status from URL parameters
        // Paystack sends these as query parameters in the URL
        const urlParams = new URLSearchParams(window.location.search);
        console.log('All URL params:', Object.fromEntries(urlParams.entries()));

        // Paystack sends 'reference' parameter, and sometimes 'trxref' which is the same
        const reference = urlParams.get('reference') || urlParams.get('trxref');
        // Status is not sent directly, we need to verify the transaction with Paystack
        // For now, we'll send 'success' and let the backend verify actual status
        const status = 'success'; // We'll let backend verify actual status

        console.log('Callback parameters:', { reference, status });

        if (!reference) {
          setStatus('error');
          setMessage('Invalid callback parameters - missing reference');
          return;
        }

        // Check if this callback has already been processed to prevent duplicates
        const processedCallbacks = JSON.parse(localStorage.getItem('processed_callbacks') || '[]');
        if (processedCallbacks.includes(reference)) {
          console.log(`Callback for reference ${reference} already processed, skipping`);
          setStatus('success');
          setMessage('Top-up has been processed successfully');
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
          return;
        }
        
        // Send callback data to backend
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${API_BASE_URL}/topup/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reference,
            status
          })
        });
        
        if (response.ok) {
          setStatus('success');
          setMessage('Top-up processed successfully! Your balance will be updated shortly.');

          // Mark this callback as processed to prevent duplicates
          const processedCallbacks = JSON.parse(localStorage.getItem('processed_callbacks') || '[]');
          if (!processedCallbacks.includes(reference)) {
            processedCallbacks.push(reference);
            localStorage.setItem('processed_callbacks', JSON.stringify(processedCallbacks));
          }

          // Refresh dashboard data
          try {
            await dashboardAPI.getDashboardData(false);
          } catch (error) {
            console.error('Failed to refresh dashboard:', error);
          }

          // Redirect to dashboard after a delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          const errorData = await response.json();
          setStatus('error');
          setMessage(errorData.detail || 'Failed to process top-up');
        }
      } catch (error) {
        console.error('Error in processCallback:', error);
        setStatus('error');
        setMessage('Error processing top-up: ' + error.message);
      }
    };
    
    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Processing Payment</h2>
            <p className="text-gray-600">Please wait while we process your top-up...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TopUpCallback;
