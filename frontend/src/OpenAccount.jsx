import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const InvestmentPage = () => {
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Simulate notification for demo purposes
    const demoUser = {
      first_name: 'Dear User'
    };
    const demoMessage = 'Your account has been successfully created! Start investing today to watch your wealth grow.';

    // Uncomment below to see the notification
    setNotificationMessage(demoMessage);
    setUserInfo(demoUser);
    setShowNotification(true);

    // Auto-hide notification after 8 seconds
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const handlewizard = () => {
    navigate('/open-account-wizard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      {/* Notification Popup - Mobile Optimized */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 sm:w-11/12 sm:max-w-lg"
          >
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 sm:p-5 shadow-2xl border-4 border-lime-500">
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Icon - Slightly smaller on mobile */}
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/40">
                  <AlertCircle className="text-white w-6 h-6 sm:w-7 sm:h-7" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {userInfo && (
                    <div className="text-sm sm:text-base font-bold text-gray-900 mb-1.5 sm:mb-2">
                      Welcome, {userInfo.first_name}! 👋
                    </div>
                  )}
                  <div className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-2.5 sm:mb-3">
                    {notificationMessage}
                  </div>
                  <button
                    onClick={handlewizard}
                    className="bg-gradient-to-r from-lime-500 to-lime-600 text-white border-0 rounded-lg px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold cursor-pointer shadow-md shadow-lime-500/30 hover:shadow-lg hover:shadow-lime-500/40 active:scale-95 sm:hover:scale-105 transition-all duration-200 w-full sm:w-auto"
                  >
                    Open Account Now →
                  </button>
                </div>

                {/* Close Button - Touch-friendly size */}
                <button
                  onClick={() => setShowNotification(false)}
                  className="flex-shrink-0 w-8 h-8 bg-gray-100 border-0 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200"
                  aria-label="Close notification"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl w-full">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden lg:flex lg:items-center lg:min-h-[500px]">

          {/* Image Section */}
          <div className="lg:w-1/2 p-8 lg:p-12 bg-gradient-to-br from-emerald-100 to-teal-100">
            <div className="flex justify-center mb-8 lg:mb-0">
              <div className="relative">
                {/* Wallet illustration */}
                <div className="relative">
                  <div className="w-48 h-36 bg-gradient-to-br from-red-900 to-red-800 rounded-2xl transform rotate-12 shadow-xl">
                    <div className="absolute top-4 left-4 w-8 h-6 bg-pink-400 rounded"></div>
                  </div>

                  {/* Money bills */}
                  <div className="absolute -top-4 left-8 w-20 h-12 bg-green-400 rounded transform -rotate-12 shadow-md">
                    <div className="absolute top-2 left-2 w-4 h-4 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="absolute -top-2 left-12 w-20 h-12 bg-green-500 rounded transform -rotate-6 shadow-md">
                    <div className="absolute top-2 left-2 w-4 h-4 bg-green-600 rounded-full"></div>
                  </div>

                  {/* Floating coins */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-8 -right-4 w-8 h-8 bg-yellow-400 rounded-full shadow-lg"
                  ></motion.div>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute top-2 -right-8 w-6 h-6 bg-yellow-500 rounded-full shadow-lg"
                  ></motion.div>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-4 -right-2 w-7 h-7 bg-yellow-400 rounded-full shadow-lg"
                  ></motion.div>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    className="absolute bottom-8 -left-6 w-5 h-5 bg-yellow-500 rounded-full shadow-lg"
                  ></motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="lg:w-1/2 p-8 lg:p-12">
            <div className="max-w-md mx-auto lg:mx-0">
              <h1 className="text-3xl lg:text-4xl font-bold text-emerald-900 mb-8 text-center lg:text-left">
                Watch Your<br />
                Investment Grow
              </h1>

              {/* Features List */}
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">Earn up to 15% monthly</span> on your investment
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">AI Tracked Payout</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">No Delays in Payments</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="text-center lg:text-left">
                <button
                  className="w-full lg:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-3 px-8 rounded-full text-base lg:text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  onClick={handlewizard}
                >
                  Open Investment Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentPage;
