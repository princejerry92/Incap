import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSessionToken, dashboardAPI } from './services/api';
import { motion } from 'framer-motion';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing your login...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session token from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const sessionToken = urlParams.get('session_token');

        if (!sessionToken) {
          throw new Error('No session token received');
        }

        // Store session token
        setSessionToken(sessionToken);
        // Also set it directly on the dashboardAPI
        dashboardAPI.setToken(sessionToken);

        setStatus('Checking your account...');

        // Check if user has an investor account
        try {
          const investmentData = await dashboardAPI.getInvestments();

          if (investmentData.success && investmentData.data.investments && investmentData.data.investments.length > 0) {
            // User has investment accounts, redirect to dashboard
            setStatus('Welcome back! Redirecting to dashboard...');
            setTimeout(() => {
              navigate('/dashboard');
            }, 1000);
          } else {
            // No investment accounts, redirect to open account page
            setStatus('Setting up your account...');
            setTimeout(() => {
              navigate('/investment', {
                state: {
                  message: "You don't seem to have an investment account. Let's open one for you!"
                }
              });
            }, 1000);
          }
        } catch (investmentError) {
          console.error('Error checking investments:', investmentError);
          
          // Check if it's a network error
          if (investmentError.message && investmentError.message.includes('Network connection failed')) {
            setError('Network connection failed. Please check your internet connection and try again.');
          } else {
            // If there's an error checking investments, still redirect to investment page
            setStatus('Setting up your account...');
            setTimeout(() => {
              navigate('/investment', {
                state: {
                  message: "You don't seem to have an investment account. Let's open one for you!"
                }
              });
            }, 1000);
          }
        }
      } catch (err) {
        console.error('Login error:', err);
        setError(err.message || 'Something went wrong during login');

        // Redirect to login page after error
        setTimeout(() => {
          navigate('/login', { state: { error: err.message } });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 30%, #059669 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '"Lexend Deca", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <motion.div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '48px',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {!error ? (
          <>
            {/* Loading Spinner */}
            <motion.div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #84cc16',
                borderRadius: '50%'
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
            
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '12px'
            }}>
              {status}
            </h2>
            
            <p style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Please wait while we set everything up for you...
            </p>
          </>
        ) : (
          <>
            {/* Error Icon */}
            <motion.div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                background: '#fee2e2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: 'spring',
                stiffness: 200,
                damping: 10
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M6 18L18 6M6 6l12 12" 
                  stroke="#dc2626" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
            
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '12px'
            }}>
              Login Failed
            </h2>
            
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px'
            }}>
              {error}
            </p>
            
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#1e40af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1e3a8a'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#1e40af'}
            >
              Try Again
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default GoogleCallback;