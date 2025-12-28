import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { CustomerPortalApp } from './components/CustomerPortal';
import SalonOwnerApp from './components/SalonOwnerApp';
import LoginScreen from './components/LoginScreen';
import './App.css';

export default function SalonApp() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    // Check if owner is already logged in
    const user = localStorage.getItem('user');
    if (user) setCurrentUser(JSON.parse(user));
  }, []);

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  if (isSignedIn && clerkUser) {
    return <CustomerPortalApp clerkUser={clerkUser} />;
  }

  if (currentUser) {
    return <SalonOwnerApp onLogout={() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setCurrentUser(null);
    }} />;
  }

  return <LoginScreen onLogin={setCurrentUser} />;
}