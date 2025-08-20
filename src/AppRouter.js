import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SplashScreen from './SplashScreen';
import GetStarted from './GetStarted';
import MobileHome from './MobileHome';
import DesktopHome from './DesktopHome';
import Login from './login';
import Signup from './CreateAccount';
import InvestmentPage from './OpenAccount';
import AccountWizard from './OpenAccountWizard';
import PaystackCheckout from './payStack';
import Dashboard from './Dashboard';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/get-started" element={<GetStarted />} />
      <Route path="/login" element={<Login />} />
      <Route path="/mobile-home" element={<MobileHome />} />
      <Route path="/desktop-home" element={<DesktopHome />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/investment" element={<InvestmentPage />} />
      <Route path="/open-account-wizard" element={<AccountWizard />} />
      <Route path="/paystack-checkout" element={<PaystackCheckout />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {/* Add more routes as needed */}
    </Routes>
  );
}

export default AppRouter;
