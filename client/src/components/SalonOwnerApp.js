import React, { useState } from 'react';
import SalonNavigation from './SalonNavigation';
import Dashboard from './Dashboard';
import OwnerPortal from './OwnerPortal';
import Subscriptions from './Subscriptions';
import Profile from './Profile';
import './SalonOwnerApp.css';

function SalonOwnerApp({ onLogout }) {
  const [activeView, setActiveView] = useState('dashboard');

  const views = {
    dashboard: <Dashboard onBack={() => {}} />,
    customers: <OwnerPortal onLogout={onLogout} setShowDashboard={() => setActiveView('dashboard')} />,
    subscriptions: <Subscriptions />,
    profile: <Profile />
  };

  return (
    <div className="salon-owner-app">
      <SalonNavigation activeView={activeView} setActiveView={setActiveView} onLogout={onLogout} />
      <main className="main-content">
        {views[activeView] || views.dashboard}
      </main>
    </div>
  );
}

export default SalonOwnerApp;
