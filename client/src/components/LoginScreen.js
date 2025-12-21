import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { CustomerLoginScreen } from './CustomerPortal';
import { Package, User } from 'lucide-react';


function LoginScreen({ onLogin }) {
    const [loginMode, setLoginMode] = useState('choice'); // 'choice', 'owner', or 'customer'
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [salonName, setSalonName] = useState('');
    const [salonPhone, setSalonPhone] = useState('');
    const [salonAddress, setSalonAddress] = useState('');
    const [loading, setLoading] = useState(false);
  
    const handleLogin = async () => {
      if (!email || !password) {
        alert('Please fill in all fields');
        return;
      }
      
      setLoading(true);
      try {
        const response = await authAPI.login(email, password);
        const { token, user } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        onLogin(user);
      } catch (error) {
        const message = error.response?.data?.message || 'Login failed';
        alert(message);
      } finally {
        setLoading(false);
      }
    };
  
    const handleRegister = async () => {
      if (!salonName || !email || !password || !salonPhone || !salonAddress) {
        alert('Please fill in all fields');
        return;
      }
      
      setLoading(true);
      try {
        const response = await authAPI.registerSalon(salonName, email, salonPhone, salonAddress, password);
        const { token, user } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        onLogin(user);
      } catch (error) {
        const message = error.response?.data?.message || 'Registration failed';
        alert(message);
      } finally {
        setLoading(false);
      }
    };
  
    // Login choice screen
    if (loginMode === 'choice') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Package className="w-8 h-8 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">MarkMyVisit</h1>
              <p className="text-gray-600 mt-2">Choose your login type</p>
            </div>
  
            <div className="space-y-4">
              <button
                onClick={() => setLoginMode('owner')}
                className="w-full p-6 border-2 border-purple-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
              >
                <div className="font-bold text-lg text-gray-800">🏢 Salon Owner</div>
                <p className="text-sm text-gray-600 mt-1">Manage your salon, customers, and subscriptions</p>
              </button>
  
              <button
                onClick={() => setLoginMode('customer')}
                className="w-full p-6 border-2 border-purple-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
              >
                <div className="font-bold text-lg text-gray-800">👤 Customer</div>
                <p className="text-sm text-gray-600 mt-1">View your subscriptions and visit history</p>
              </button>
            </div>
  
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm font-semibold text-gray-800 mb-2">👋 Welcome!</p>
              <p className="text-xs text-gray-600">
                Select your role to log in to the Salon Tracker.
              </p>
            </div>
          </div>
        </div>
      );
    }
  
    // Customer login screen (uses Clerk)
    if (loginMode === 'customer') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <button
              onClick={() => {
                setLoginMode('choice');
                setEmail('');
                setPassword('');
              }}
              className="mb-4 text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              ← Back to login choice
            </button>
  
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <User className="w-8 h-8 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Customer Login</h1>
              <p className="text-gray-600 mt-2">Passwordless login with email</p>
            </div>
  
            <CustomerLoginScreen onLoginSuccess={() => {}} />
          </div>
        </div>
      );
    }
  
    // Owner login screen (existing)
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <button
            onClick={() => {
              setLoginMode('choice');
              setEmail('');
              setPassword('');
              setIsRegistering(false);
            }}
            className="mb-4 text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            ← Back to login choice
          </button>
  
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Package className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Salon Tracker</h1>
            <p className="text-gray-600 mt-2">{isRegistering ? 'Create Your Salon Account' : 'Owner Portal'}</p>
          </div>
  
          <div className="space-y-4">
            {isRegistering && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salon Name</label>
                  <input
                    type="text"
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    placeholder="Your Salon Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={salonPhone}
                    onChange={(e) => setSalonPhone(e.targe.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={salonAddress}
                    onChange={(e) => setSalonAddress(e.target.value)}
                    placeholder="123 Main St, City, State"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@salon.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
  
            <button
              type="button"
              onClick={isRegistering ? handleRegister : handleLogin}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300"
            >
              {loading ? (isRegistering ? 'Creating Account...' : 'Signing In...') : (isRegistering ? 'Create Account' : 'Sign In')}
            </button>
  
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setEmail('');
                setPassword('');
                setSalonName('');
                setSalonPhone('');
                setSalonAddress('');
              }}
              className="w-full text-purple-600 py-2 font-medium hover:text-purple-700 transition-colors"
            >
              {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
  
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm font-semibold text-gray-800 mb-2">👋 Welcome!</p>
            <p className="text-xs text-gray-600">
              {isRegistering 
                ? 'Create your salon account to start managing subscriptions and visits.'
                : 'Sign in with your salon owner credentials to access your portal.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  export default LoginScreen;