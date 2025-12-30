import React from 'react';
import { LayoutDashboard, Users, CreditCard, Calendar, User, LogOut } from 'lucide-react';
import './SalonNavigation.css';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'customers', icon: Users, label: 'Customers' },
  { id: 'subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { id: 'appointments', icon: Calendar, label: 'Appointments' },
];

function SalonNavigation({ activeView, setActiveView, onLogout }) {
  return (
    <>
      {/* Mobile Top Header with Profile & Logout */}
      <div className="mobile-top-header">
        <div className="mobile-top-actions">
          <button
            className={`nav-item-top-button ${activeView === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveView('profile')}
            title="Profile"
          >
            <User size={20} />
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="nav-logout-top"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="salon-navigation-mobile-bottom">
        <div className="mobile-nav-items">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`mobile-nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveView(item.id);
                }}
              >
                <Icon className="mobile-nav-icon" size={24} />
                <span className="mobile-nav-label">{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <nav className="salon-navigation">
        <div className="nav-items-container">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveView(item.id);
                }}
              >
                <Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </a>
            );
          })}
          <a
            href="#profile"
            className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveView('profile');
            }}
          >
            <User className="nav-icon" />
            <span className="nav-label">Profile</span>
          </a>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="nav-logout"
          >
            <LogOut className="nav-icon" />
            <span className="nav-label">Logout</span>
          </button>
        )}
      </nav>
    </>
  );
}

export default SalonNavigation;
