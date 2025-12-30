import React, { useState } from 'react';
import SalonNavigation from './SalonNavigation';
import Dashboard from './Dashboard';
import OwnerPortal from './OwnerPortal';
import Profile from './Profile';
import Subscriptions from './Subscriptions';
import AppointmentsManager from './AppointmentsManager';
import AvailabilitySettings from './AvailabilitySettings';
import './SalonOwnerApp.css';

function SalonOwnerApp({ onLogout }) {
  const [activeView, setActiveView] = useState('dashboard');

  const views = {
    dashboard: <Dashboard onBack={() => {}} />,
    customers: <OwnerPortal onLogout={onLogout} setShowDashboard={() => setActiveView('dashboard')} />,
    subscriptions: <Subscriptions />,
    appointments: <AppointmentsManager onOpenSettings={() => setActiveView('availability')} />,
    profile: <Profile />
  };

  return (
    <div className="salon-owner-app">
      <SalonNavigation activeView={activeView} setActiveView={setActiveView} onLogout={onLogout} />
      <main className="main-content">
        {activeView === 'availability' ? (
          <AvailabilitySettings onBack={() => setActiveView('appointments')} />
        ) : (
          views[activeView] || views.dashboard
        )}
      </main>
    </div>
  );
}

export default SalonOwnerApp;
