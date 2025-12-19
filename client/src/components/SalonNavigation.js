import React from 'react';
import { LayoutDashboard, Users, CreditCard, User, LogOut } from 'lucide-react';
import './SalonNavigation.css';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'customers', icon: Users, label: 'Customers' },
  { id: 'subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { id: 'profile', icon: User, label: 'Profile' },
];

function SalonNavigation({ activeView, setActiveView, onLogout }) {
  return (
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
  );
}

export default SalonNavigation;