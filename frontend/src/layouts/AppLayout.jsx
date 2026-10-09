import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DisclaimerBanner from '../components/DisclaimerBanner';

const AppLayout = () => {
  return (
    <div className="app-container">
      <DisclaimerBanner />
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
