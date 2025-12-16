import React, { useState } from 'react';
import SalonNavigation from './SalonNavigation';
import Dashboard from './Dashboard';
import OwnerPortal from './OwnerPortal';
import Subscriptions from './Subscriptions';
import Profile from './Profile';
import './SalonOwnerApp.css';

function SalonOwnerApp({ onLogout }) {
  const [activeView, setActiveView] = useState('dashboard');

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onBack={() => {}} />;
      case 'customers':
        return <OwnerPortal onLogout={onLogout} setShowDashboard={() => setActiveView('dashboard')} />;
      case 'subscriptions':
        return <Subscriptions />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard onBack={() => {}} />;
    }
  };

  return (
    <div className="salon-owner-app">
      <SalonNavigation activeView={activeView} setActiveView={setActiveView} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default SalonOwnerApp;
