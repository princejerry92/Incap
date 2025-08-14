import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SplashScreen from './SplashScreen';
import GetStarted from './GetStarted';
import MobileHome from './MobileHome';
import DesktopHome from './DesktopHome';
import Login from './login';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/get-started" element={<GetStarted />} />
      <Route path="/login" element={<Login />} />
      <Route path="/mobile-home" element={<MobileHome />} />
      <Route path="/desktop-home" element={<DesktopHome />} />
    </Routes>
  );
}

export default AppRouter;
