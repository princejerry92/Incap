import React, { useState, useRef, useEffect } from 'react';
import { customerCareAPI } from '../services/api';
import { getSessionToken } from '../services/api';

const CustomerCare = ({ initialCategory = 'financial', initialMessage = '' }) => {
  const [category, setCategory] = useState(initialCategory);
  const [message, setMessage] = useState(initialMessage);
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [messageLength, setMessageLength] = useState(initialMessage.length);
  const fileInputRef = useRef(null);
  const MAX_MESSAGE_LENGTH = 2000;

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    if (initialMessage) setMessage(initialMessage);
    if (initialCategory) setCategory(initialCategory);
  }, [initialMessage, initialCategory]);

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (images only)
      if (!file.type.startsWith('image/')) {
        setSubmitError('Please upload an image file (JPEG, PNG, etc.)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('File size must be less than 5MB');
        return;
      }

      setAttachment(file);
      setSubmitError('');
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Sanitize input to prevent XSS and injection attacks
  const sanitizeInput = (input) => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/vbscript:/gi, '') // Remove vbscript: URLs
      .replace(/data:\s*text\/html/gi, '') // Remove data URLs with HTML
      .trim();
  };

  const handleMessageChange = (e) => {
    const input = e.target.value;
    const cleanInput = sanitizeInput(input);

    // Enforce character limit
    if (cleanInput.length <= MAX_MESSAGE_LENGTH) {
      setMessage(cleanInput);
      setMessageLength(cleanInput.length);
      setSubmitError(''); // Clear error if any
    } else {
      setSubmitError(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setSubmitError('Please enter your query');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // Ensure token is set
      const token = getSessionToken();
      if (token) {
        customerCareAPI.setToken(token);
      } else {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Submit query through API
      const result = await customerCareAPI.submitQuery(category, message, attachment);

      if (result && result.success !== undefined) {
        if (result.success) {
          // Reset form
          setCategory('financial');
          setMessage('');
          setAttachment(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }

          setSubmitSuccess(true);
        } else {
          throw new Error(result.error || 'Failed to submit query');
        }
      } else {
        // Handle case where result is undefined or doesn't have success property
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error submitting query:', error);
      setSubmitError(error.message || 'Failed to submit your query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10 flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Customer Care</h2>
              <p className="text-blue-100 mt-1">
                We're here to help! Submit your query and we'll respond within 10-30 minutes.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 font-medium">
                  Your query has been submitted successfully! Our team will respond within 10-30 minutes.
                </span>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 font-medium">{submitError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-800 mb-1 flex items-center">
                    <span className="bg-blue-600 text-white p-1 rounded-md mr-2">
                      <span className="text-xs">🏷️</span>
                    </span>
                    Category
                  </label>
                </div>
                <div className="relative">
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 shadow-sm hover:shadow-md focus:shadow-lg appearance-none bg-white"
                  >
                    <option value="financial">💰 Financial</option>
                    <option value="complaints">😤 Complaints</option>
                    <option value="information">ℹ️ Information</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-800 mb-1 flex items-center">
                    <span className="bg-blue-600 text-white p-1 rounded-md mr-2">
                      <span className="text-xs">💬</span>
                    </span>
                    Your Query
                  </label>
                </div>
                <div className="relative">
                  <textarea
                    id="message"
                    rows={6}
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="Please describe your query in detail. Be as specific as possible to help us resolve your issue faster..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 shadow-sm hover:shadow-md focus:shadow-lg resize-vertical"
                    maxLength={MAX_MESSAGE_LENGTH}
                  />
                  <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                    {messageLength > MAX_MESSAGE_LENGTH * 0.8 && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${messageLength > MAX_MESSAGE_LENGTH ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                        {messageLength > MAX_MESSAGE_LENGTH ? 'Limit exceeded' : 'Approaching limit'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex justify-between">
                  <span>{messageLength}/{MAX_MESSAGE_LENGTH} characters</span>
                  <span className="text-blue-600 font-medium">Max 2000 characters</span>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <label className="block text-sm font-semibold text-gray-800 mb-1 flex items-center">
                    <span className="bg-blue-600 text-white p-1 rounded-md mr-2">
                      <span className="text-xs">📎</span>
                    </span>
                    Attachment (Optional)
                  </label>
                </div>
                <div className="relative">
                  <div className={`flex justify-center px-6 pt-6 pb-8 border-2 transition-all duration-200 ${attachment
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 border-dashed hover:border-blue-300 hover:bg-blue-50'
                    } rounded-xl`}>
                    {attachment ? (
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                          <p className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={removeAttachment}
                          className="flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 text-center">
                        <div className="flex justify-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400 transition-transform duration-200 hover:scale-110" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="flex flex-col items-center space-y-1">
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 inline-flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                              </svg>
                              <span>Choose File</span>
                            </span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              ref={fileInputRef}
                              onChange={handleAttachmentChange}
                              accept="image/*"
                              className="sr-only"
                            />
                          </label>
                          <p className="text-xs text-gray-500">or drag and drop here</p>
                          <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex">
                  <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Response Time</h3>
                    <div className="mt-1 text-sm text-blue-700">
                      <p>We guarantee a response within 10-30 minutes during business hours.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white transition-all duration-200 transform ${isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Submitting Query...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Submit Query</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerCare;
