import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { CustomerPortalApp } from './components/CustomerPortal';
import SalonOwnerApp from './components/SalonOwnerApp';
import LoginScreen from './components/LoginScreen'; // Assuming LoginScreen is refactored to its own file
import './components/SalonOwnerApp.css';
import './App.css';


export default function SalonApp() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    // Check if owner is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  // If Clerk is still loading, show loading screen
  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  // If user is Clerk-authenticated, show Customer Portal
  if (isSignedIn && clerkUser) {
    // A logout for the customer portal would be handled inside CustomerPortalApp
    return <CustomerPortalApp clerkUser={clerkUser} onLogout={() => { /* handle clerk logout */ }} />;
  }

  // If owner is logged in, show Owner Portal
  if (currentUser) {
    return <SalonOwnerApp onLogout={handleLogout} />;
  }

  // If nobody is logged in, show login screen
  // We need to create a LoginScreen component or assume one exists
  // For now, let's assume it exists and it calls onLogin upon success
  return <LoginScreen onLogin={handleLogin} />;
}