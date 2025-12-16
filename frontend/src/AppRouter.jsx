import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import NotFound from './NotFound';
import SplashScreen from './SplashScreen';
import GetStarted from './GetStarted';
import Login from './login';
import Signup from './CreateAccount';
import InvestmentPage from './OpenAccount';
import AccountWizard from './OpenAccountWizard';
import PaystackCheckout from './payStack';
import Dashboard from './Dashboard';
import AffiliateNetwork from './AffiliateNetwork';
import SecureCardWallet from './myCards';
import Discovery from './Discover';
import MyIFunds from './my-ifunds';
import PaymentService from './paymentService';
import GoogleCallback from './GoogleCallback';
import DueDateCalendar from './components/DueDateCalendar';
import Goals from './Goals';
import TopUpCallback from './TopUpCallback';
import ForgotPassword from './ForgotPassword';
import VerifyCode from './VerifyCode';
import ResetPassword from './ResetPassword';
import SecurityQuestion from './SecurityQuestion';
import portfolioAPI from './services/portfolioAPI';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';

function AppRouter() {
  useEffect(() => {
    // Initialize portfolioAPI token from localStorage on app start
    const token = localStorage.getItem('session_token');
    if (token) {
      try {
        portfolioAPI.setToken(token);
        // Lightweight debug to confirm token init (won't disrupt UI)
        // console.debug('[AppRouter] portfolioAPI token initialized');
      } catch (e) {
        // console.warn('[AppRouter] Failed to set token', e);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/security-question" element={<SecurityQuestion />} />
        <Route path="/investment" element={<InvestmentPage />} />
        <Route path="/open-account" element={<InvestmentPage />} />
        <Route path="/open-account-wizard" element={<AccountWizard />} />
        <Route path="/paystack-checkout" element={<PaystackCheckout />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/affiliate-network" element={<AffiliateNetwork />} />
        <Route path="/my-cards" element={<SecureCardWallet />} />
        <Route path="/discover" element={<Discovery />} />
        <Route path="/group-funds" element={<MyIFunds />} />
        <Route path="/payment-config" element={<PaymentService />} />
        <Route path="/due-dates" element={<DueDateCalendar />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/topup/callback" element={<TopUpCallback />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default AppRouter;
