import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, User } from 'lucide-react';

const Signup = () => {
  const [form, setForm] = useState({
    firstName: '',
    surname: '',
    email: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    nin: '',
    profilePic: null
  });
  const [focusedField, setFocusedField] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      setForm({ ...form, profilePic: file });
      const reader = new FileReader();
      reader.onload = (e) => setProfilePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Signup attempt:', form);
    // TODO: integrate FastAPI endpoint
  };

  const containerStyle = {
    minHeight: '100vh',
    background: isMobile 
      ? 'white' 
      : 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 30%, #059669 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '0' : '20px',
    fontFamily: '"Lexend Deca", -apple-system, BlinkMacSystemFont, sans-serif'
  };

  const cardStyle = {
    background: isMobile ? 'white' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: isMobile ? 'none' : 'blur(20px)',
    borderRadius: isMobile ? '0' : '24px',
    padding: '32px',
    width: '100%',
    maxWidth: isMobile ? 'none' : '500px',
    height: isMobile ? '100vh' : 'auto',
    boxShadow: isMobile ? 'none' : '0 25px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: isMobile ? 'flex-start' : 'center',
    paddingTop: isMobile ? '60px' : '32px',
    overflowY: 'auto'
  };

  const inputStyle = (fieldName) => ({
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: focusedField === fieldName ? '2px solid #84cc16' : '2px solid #e5e7eb',
    fontSize: '16px',
    fontFamily: '"Lexend Deca", sans-serif',
    backgroundColor: 'white',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: focusedField === fieldName 
      ? '0 0 0 3px rgba(132, 204, 22, 0.1)' 
      : '0 1px 2px rgba(0, 0, 0, 0.05)',
    boxSizing: 'border-box'
  });

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  };

  const fieldContainerStyle = {
    marginBottom: '16px'
  };

  return (
    <div style={containerStyle}>
      {/* Background decorative elements - only on tablet+ */}
      {!isMobile && (
        <>
          <motion.div
            style={{
              position: 'absolute',
              top: '15%',
              right: '-5%',
              width: '200px',
              height: '200px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '50%',
              filter: 'blur(40px)'
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          <motion.div
            style={{
              position: 'absolute',
              bottom: '20%',
              left: '-10%',
              width: '150px',
              height: '150px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '50%',
              filter: 'blur(30px)'
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.05, 0.2]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </>
      )}

      <motion.div
        style={cardStyle}
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
      >
        {/* Title */}
        <motion.h1
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '8px',
            fontFamily: '"Lexend Deca", sans-serif'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Create Account
        </motion.h1>

        {/* Terms text */}
        <motion.p
          style={{
            fontSize: '12px',
            color: '#666666',
            marginBottom: '24px',
            fontWeight: '400'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Join us to start your investment journey
        </motion.p>

        {/* Profile Picture Upload */}
        <motion.div
          style={fieldContainerStyle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <label style={labelStyle}>Profile Picture</label>
          <motion.div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: dragOver ? '3px dashed #84cc16' : '2px dashed #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: dragOver ? 'rgba(132, 204, 22, 0.05)' : '#f9fafb',
              margin: '0 auto 16px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {profilePreview ? (
              <img 
                src={profilePreview} 
                alt="Profile preview" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
              />
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                color: '#9ca3af'
              }}>
                <Camera size={24} />
                <span style={{ fontSize: '10px', textAlign: 'center' }}>
                  Upload Photo
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
          </motion.div>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          style={{ marginBottom: '24px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {/* Name Row */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>First Name</label>
              <motion.input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                onFocus={() => setFocusedField('firstName')}
                onBlur={() => setFocusedField(null)}
                required
                style={inputStyle('firstName')}
                animate={{
                  scale: focusedField === 'firstName' ? 1.02 : 1
                }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Surname</label>
              <motion.input
                type="text"
                name="surname"
                value={form.surname}
                onChange={handleChange}
                onFocus={() => setFocusedField('surname')}
                onBlur={() => setFocusedField(null)}
                required
                style={inputStyle('surname')}
                animate={{
                  scale: focusedField === 'surname' ? 1.02 : 1
                }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          {/* Email Field */}
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Email</label>
            <motion.input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
              style={inputStyle('email')}
              animate={{
                scale: focusedField === 'email' ? 1.02 : 1
              }}
              transition={{ duration: 0.2 }}
            />
          </div>

          {/* Phone Number Field */}
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Phone Number</label>
            <motion.input
              type="tel"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              onFocus={() => setFocusedField('phoneNumber')}
              onBlur={() => setFocusedField(null)}
              required
              style={inputStyle('phoneNumber')}
              animate={{
                scale: focusedField === 'phoneNumber' ? 1.02 : 1
              }}
              transition={{ duration: 0.2 }}
            />
          </div>

          {/* Address Field */}
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>Address</label>
            <motion.textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              onFocus={() => setFocusedField('address')}
              onBlur={() => setFocusedField(null)}
              required
              rows="3"
              style={{
                ...inputStyle('address'),
                resize: 'vertical',
                minHeight: '80px'
              }}
              animate={{
                scale: focusedField === 'address' ? 1.02 : 1
              }}
              transition={{ duration: 0.2 }}
            />
          </div>

          {/* Date of Birth and NIN Row */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Date of Birth</label>
              <motion.input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                onFocus={() => setFocusedField('dateOfBirth')}
                onBlur={() => setFocusedField(null)}
                required
                style={inputStyle('dateOfBirth')}
                animate={{
                  scale: focusedField === 'dateOfBirth' ? 1.02 : 1
                }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          {/* NIN Field */}
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>National Identity Number (NIN)</label>
            <motion.input
              type="text"
              name="nin"
              value={form.nin}
              onChange={handleChange}
              onFocus={() => setFocusedField('nin')}
              onBlur={() => setFocusedField(null)}
              required
              maxLength="11"
              style={inputStyle('nin')}
              animate={{
                scale: focusedField === 'nin' ? 1.02 : 1
              }}
              transition={{ duration: 0.2 }}
            />
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #84cc16, #65a30d)',
              color: '#1a1a1a',
              fontSize: '16px',
              fontWeight: '600',
              padding: '16px',
              borderRadius: '50px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: '"Lexend Deca", sans-serif',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 25px rgba(132, 204, 22, 0.3)',
              marginTop: '8px'
            }}
            onHoverStart={() => setHoveredButton('submit')}
            onHoverEnd={() => setHoveredButton(null)}
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 12px 35px rgba(132, 204, 22, 0.4)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
              }}
              animate={{
                left: hoveredButton === 'submit' ? '100%' : '-100%'
              }}
              transition={{ duration: 0.6 }}
            />
            <span style={{ position: 'relative', zIndex: 1 }}>Create Account</span>
          </motion.button>
        </motion.form>

        {/* Divider */}
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '24px 0',
            gap: '12px'
          }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div style={{
            flex: 1,
            height: '1px',
            background: 'linear-gradient(to right, transparent, #d1d5db, transparent)'
          }} />
          <span style={{
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            Or
          </span>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'linear-gradient(to left, transparent, #d1d5db, transparent)'
          }} />
        </motion.div>

        {/* Google Sign Up Button */}
        <motion.button
          style={{
            width: '100%',
            background: 'white',
            border: '2px solid #e5e7eb',
            color: '#374151',
            fontSize: '16px',
            fontWeight: '500',
            padding: '14px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontFamily: '"Lexend Deca", sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '24px',
            transition: 'all 0.2s ease'
          }}
          onHoverStart={() => setHoveredButton('google')}
          onHoverEnd={() => setHoveredButton(null)}
          whileHover={{ 
            scale: 1.01,
            borderColor: '#d1d5db',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
          whileTap={{ scale: 0.99 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </motion.button>

        {/* Terms and Login Link */}
        <motion.div
          style={{
            textAlign: 'center'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '12px',
            lineHeight: '1.4'
          }}>
            By creating an account, you agree to our{' '}
            <span style={{
              color: '#2563eb',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}>
              Terms and Conditions
            </span>
          </p>
          
          <motion.span
            style={{
              fontSize: '14px',
              color: '#2563eb',
              cursor: 'pointer',
              fontWeight: '500',
              textDecoration: 'underline'
            }}
            whileHover={{ color: '#1d4ed8' }}
            whileTap={{ scale: 0.98 }}
          >
            Already have an account? Log in
          </motion.span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;