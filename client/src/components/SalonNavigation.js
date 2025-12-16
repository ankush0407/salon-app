import React from 'react';
import { LayoutDashboard, Users, CreditCard, User } from 'lucide-react';
import './SalonNavigation.css';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'customers', icon: Users, label: 'Customers' },
  { id: 'subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { id: 'profile', icon: User, label: 'Profile' },
];

function SalonNavigation({ activeView, setActiveView }) {
  return (
    <nav className="salon-navigation">
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
    </nav>
  );
}

export default SalonNavigation;
