import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, User, Package, ChevronRight, Search, Plus, Check, X, PieChart } from 'lucide-react';
import { authAPI, customersAPI, subscriptionsAPI, subscriptionTypesAPI } from './services/api';
import Dashboard from './components/Dashboard';


function AddCustomerModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ name: '', email: '', phone: '' });
    } catch (error) {
      alert('Error adding customer: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300"
            >
              {loading ? 'Adding...' : 'Add Customer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function ManageSubscriptionTypesModal({ onClose, subscriptionTypes, onAdd, onDelete }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', visits: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.visits) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await onAdd(formData);
      setFormData({ name: '', price: '', visits: '' });
      setShowAddForm(false);
    } catch (error) {
      alert('Error adding subscription type: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (typeId) => {
    if (!window.confirm('Are you sure you want to delete this subscription type?')) {
      return;
    }

    try {
      await onDelete(typeId);
    } catch (error) {
      alert('Error deleting subscription type: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Manage Subscription Types</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-4 flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add New Subscription Type
          </button>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-4">Add New Subscription Type</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 10-Visit Spa Package"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., 99.99"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Visits</label>
                <input
                  type="number"
                  value={formData.visits}
                  onChange={(e) => setFormData({ ...formData, visits: e.target.value })}
                  placeholder="e.g., 10"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', price: '', visits: '' });
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
                >
                  {loading ? 'Adding...' : 'Add Type'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-3">Existing Subscription Types</h3>
          {subscriptionTypes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No subscription types yet</p>
          ) : (
            <div className="space-y-2">
              {subscriptionTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{type.name}</p>
                    <p className="text-sm text-gray-600">{type.visits} visits included</p>
                  </div>
                  <button
                    onClick={() => handleDelete(type.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
function AddSubscriptionModal({ onClose, onSubmit, subscriptionTypes }) {
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) return;
    
    setLoading(true);
    try {
      await onSubmit(selectedType);
    } catch (error) {
      alert('Error adding subscription: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add Subscription Package</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto pr-2">
          {subscriptionTypes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No subscription types available. Ask owner to add some.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {subscriptionTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedType?.id === type.id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{type.name}</h3>
                    {selectedType?.id === type.id && (
                      <Check className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{type.visits} visits included</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedType || loading || subscriptionTypes.length === 0}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              selectedType && !loading && subscriptionTypes.length > 0
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Adding...' : 'Add Subscription'}
          </button>
        </div>
      </div>
    </div>
  );
}
function RedeemVisitModal({ onClose, onSubmit, subscriptionName }) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(note);
      onClose();
    } catch (error) {
      alert('Error redeeming visit: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Redeem Visit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Redeeming visit for: <strong>{subscriptionName}</strong>
          </p>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Client requested shorter length, Used special product..."
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            This note will be saved with this visit and only visible to salon owners.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300"
          >
            {loading ? 'Redeeming...' : 'Redeem Visit'}
          </button>
        </div>
      </div>
    </div>
  );
}
function LoginScreen({ onLogin }) {
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
      
      onLogin(user.role, user, user.salon_id, user.salon_name);
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
      
      onLogin(user.role, user, user.salon_id, user.salon_name);
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
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
                  onChange={(e) => setSalonPhone(e.target.value)}
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
function EditCustomerModal({ onClose, onSubmit, customer }) {
  const [formData, setFormData] = useState({ 
    name: customer.name, 
    email: customer.email, 
    phone: customer.phone 
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      alert('Error updating customer: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300"
            >
              {loading ? 'Updating...' : 'Update Customer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditVisitNoteModal({ onClose, onSubmit, currentNote, visitNumber }) {
  const [note, setNote] = useState(currentNote || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(note);
      onClose();
    } catch (error) {
      alert('Error updating note: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Note</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Editing note for: <strong>Visit {visitNumber}</strong>
          </p>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Client requested shorter length, Used special product..."
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300"
          >
            {loading ? 'Updating...' : 'Update Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
function CustomerPortal({ customer, onLogout, subscriptions, setSubscriptions }) {
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- FIX 1: Wrap loadSubscriptions in useCallback ---
  const loadSubscriptions = useCallback(async () => {
    try {
      const response = await subscriptionsAPI.getByCustomer(customer.id);
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
    // --- FIX 1: Add dependencies to useCallback ---
  }, [customer.id, setSubscriptions, setLoading]);

  useEffect(() => {
    loadSubscriptions();
    // --- FIX 1: Update useEffect dependency ---
  }, [loadSubscriptions]);


  if (selectedSubscription) {
    const visitDates = selectedSubscription.visitDates 
      ? selectedSubscription.visitDates.split(',') 
      : [];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <button
              onClick={() => setSelectedSubscription(null)}
              className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{selectedSubscription.name}</h2>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{selectedSubscription.usedVisits} / {selectedSubscription.totalVisits} visits</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all"
                  style={{ width: `${(parseInt(selectedSubscription.usedVisits) / parseInt(selectedSubscription.totalVisits)) * 100}%` }}
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-4">Visit History</h3>
            {visitDates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No visits yet</p>
            ) : (
              <div className="space-y-2">
                {visitDates.map((date, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}
</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-800">My Subscriptions</h1>
          </div>
          <button
            onClick={onLogout}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {customer.name}!</h2>
          <p className="text-gray-600">Track your subscription packages and visit history</p>
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No active subscriptions</p>
            <p className="text-gray-400 text-sm mt-2">Visit the salon to purchase a package</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {subscriptions.map((sub) => {
              const usedVisits = parseInt(sub.usedVisits) || 0;
              const totalVisits = parseInt(sub.totalVisits) || 0;
              const remaining = totalVisits - usedVisits;
              const progress = totalVisits > 0 ? (usedVisits / totalVisits) * 100 : 0;
              
              return (
                <div key={sub.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">{sub.name}</h3>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{usedVisits} / {totalVisits} visits</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-purple-600 h-3 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-3xl font-bold text-purple-600">{remaining}</p>
                      <p className="text-sm text-gray-600">visits remaining</p>
                    </div>
                    {remaining === 0 && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        Completed
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedSubscription(sub)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                  >
                    View History
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ===================================================================
// START: MODIFIED OWNER PORTAL
// ===================================================================
function OwnerPortal({
  customers,
  setCustomers,
  selectedCustomer,
  setSelectedCustomer,
  searchTerm,
  setSearchTerm,
  showAddCustomer,
  setShowAddCustomer,
  setShowDashboard,
  onLogout
}) {
  const [loading, setLoading] = useState(true);
  const [showManageTypes, setShowManageTypes] = useState(false);
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [sortBy, setSortBy] = useState('name-asc'); // NEW: Added sorting state

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [customersRes, typesRes] = await Promise.all([
          customersAPI.getAll(),
          subscriptionTypesAPI.getAll(),
        ]);
        setCustomers(customersRes.data);
        setSubscriptionTypes(typesRes.data);
      } catch (error) {
        console.error('Error loading owner data:', error);
        alert('Failed to load data. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setCustomers]);

  const handleAddCustomer = async (customerData) => {
    const response = await customersAPI.create(customerData);
    setCustomers([...customers, response.data]);
    setShowAddCustomer(false);
    alert('Customer added successfully!');
  };

  const handleAddSubscriptionType = async (typeData) => {
    const response = await subscriptionTypesAPI.create(typeData);
    setSubscriptionTypes([...subscriptionTypes, response.data]);
  };

  const handleDeleteSubscriptionType = async (typeId) => {
    await subscriptionTypesAPI.delete(typeId);
    setSubscriptionTypes(subscriptionTypes.filter((t) => t.id !== typeId));
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  // NEW: Sort customers based on selected sort option
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return (a.name || '').localeCompare(b.name || '');
      case 'name-desc':
        return (b.name || '').localeCompare(a.name || '');
      case 'email-asc':
        return (a.email || '').localeCompare(b.email || '');
      case 'email-desc':
        return (b.email || '').localeCompare(a.email || '');
      case 'recent':
        return (b.join_date || '').localeCompare(a.join_date || '');
      case 'oldest':
        return (a.join_date || '').localeCompare(b.join_date || '');
      default:
        return 0;
    }
  });

  if (selectedCustomer) {
    return (
      <CustomerDetailView
        customer={selectedCustomer}
        onBack={() => setSelectedCustomer(null)}
        onCustomerUpdated={async () => {
          // Reload customers list when customer is updated/deleted
          try {
            const response = await customersAPI.getAll();
            setCustomers(response.data);
          } catch (error) {
            console.error('Error reloading customers:', error);
          }
        }}
      />
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-800">Owner Portal</h1>
          </div>
          <button
            onClick={onLogout}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Customer Management</h2>
              <p className="text-gray-600">Manage subscriptions and track visits</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowDashboard(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <PieChart className="w-5 h-5" />
                Dashboard
              </button>
              <button
                onClick={() => setShowManageTypes(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Manage Packages
              </button>
              <button
                onClick={() => setShowAddCustomer(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Customer
              </button>
            </div>
          </div>

          {/* NEW: Updated layout with search and sort side by side */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* NEW: Sort dropdown */}
            <div className="md:w-64">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="email-asc">Email (A-Z)</option>
                <option value="email-desc">Email (Z-A)</option>
                <option value="recent">Recently Added</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* UPDATED: Now using sortedCustomers instead of filteredCustomers */}
        {sortedCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No customers found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{customer.name}</h3>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                      <p className="text-sm text-gray-500">{customer.phone}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onSubmit={handleAddCustomer}
        />
      )}
      
      {showManageTypes && (
        <ManageSubscriptionTypesModal
          onClose={() => setShowManageTypes(false)}
          subscriptionTypes={subscriptionTypes}
          onAdd={handleAddSubscriptionType}
          onDelete={handleDeleteSubscriptionType}
        />
      )}
    </div>
  );
}
// ===================================================================
// END: MODIFIED OWNER PORTAL
// ===================================================================


// ===================================================================
// START: MODIFIED CUSTOMER DETAIL VIEW
// ===================================================================
function CustomerDetailView({ customer, onBack, onCustomerUpdated }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false); // NEW: Edit customer modal
  const [showEditNote, setShowEditNote] = useState(false); // NEW: Edit note modal
  const [selectedSubscriptionForRedeem, setSelectedSubscriptionForRedeem] = useState(null);
  const [editingNote, setEditingNote] = useState(null); // NEW: Track note being edited
  const [loading, setLoading] = useState(true);

  // Wrap loadData in useCallback
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subsRes, typesRes] = await Promise.all([
        subscriptionsAPI.getByCustomer(customer.id),
        subscriptionTypesAPI.getAll(),
      ]);
      setSubscriptions(subsRes.data);
      setSubscriptionTypes(typesRes.data);
    } catch (error) {
      console.error('Error loading customer detail data:', error);
      alert('Error loading customer details.');
    } finally {
      setLoading(false);
    }
  }, [customer.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddSubscription = async (subscriptionType) => {
    try {
      await subscriptionsAPI.create({
        customer_id: customer.id,
        type_id: subscriptionType.id,
        start_date: new Date().toISOString().split('T')[0],
      });
      
      await loadData();
      setShowAddSubscription(false);
      alert('Subscription added successfully!');
    } catch (error) {
      throw error;
    }
  };

  // NEW: Handle customer update
  const handleUpdateCustomer = async (customerData) => {
    try {
      await customersAPI.update(customer.id, customerData);
      setShowEditCustomer(false);
      if (onCustomerUpdated) {
        onCustomerUpdated();
      }
      // Update local customer data
      customer.name = customerData.name;
      customer.email = customerData.email;
      customer.phone = customerData.phone;
      alert('Customer updated successfully!');
    } catch (error) {
      throw error;
    }
  };

  // NEW: Handle customer delete
  const handleDeleteCustomer = async () => {
    if (!window.confirm(`Are you sure you want to delete ${customer.name}? This will also delete all their subscriptions.`)) {
      return;
    }

    try {
      await customersAPI.delete(customer.id);
      alert('Customer deleted successfully!');
      onBack();
      if (onCustomerUpdated) {
        onCustomerUpdated();
      }
    } catch (error) {
      alert('Error deleting customer: ' + error.message);
    }
  };

  const handleOpenRedeemModal = (subscription) => {
    setSelectedSubscriptionForRedeem(subscription);
    setShowRedeemModal(true);
  };

  const handleRedeemVisit = async (note) => {
    try {
      await subscriptionsAPI.redeemVisit(selectedSubscriptionForRedeem.id, note);
      await loadData();
      setShowRedeemModal(false);
      setSelectedSubscriptionForRedeem(null);
      alert('Visit redeemed successfully!');
    } catch (error) {
      throw error;
    }
  };

  // NEW: Handle edit note
  const handleEditNote = (subscriptionId, visitId, currentNote, visitNumber) => {
    setEditingNote({ subscriptionId, visitId, currentNote, visitNumber });
    setShowEditNote(true);
  };

  // NEW: Handle update note
  const handleUpdateNote = async (newNote) => {
    try {
      await subscriptionsAPI.updateVisitNote(editingNote.subscriptionId, editingNote.visitId, newNote);
      await loadData();
      setShowEditNote(false);
      setEditingNote(null);
      alert('Note updated successfully!');
    } catch (error) {
      throw error;
    }
  };

  // NEW: Handle delete visit
  const handleDeleteVisit = async (subscriptionId, visitId, visitNumber) => {
    if (!window.confirm(`Are you sure you want to delete Visit ${visitNumber}? This cannot be undone.`)) {
      return;
    }

    try {
      await subscriptionsAPI.deleteVisit(subscriptionId, visitId);
      await loadData();
      alert('Visit deleted successfully!');
    } catch (error) {
      alert('Error deleting visit: ' + error.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
          >
            ← Back to Customers
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{customer.name}</h2>
                <p className="text-gray-600">{customer.email}</p>
                <p className="text-gray-500">{customer.phone}</p>
              </div>
            </div>
            {/* UPDATED: Added Edit and Delete buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowEditCustomer(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setShowAddSubscription(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Subscription
              </button>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-4">Active Subscriptions</h3>

        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No subscriptions yet</p>
            <p className="text-gray-400 text-sm mt-2">Add a subscription to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => {
              const usedVisits = parseInt(sub.usedVisits) || 0;
              const totalVisits = parseInt(sub.totalVisits) || 0;
              const remaining = totalVisits - usedVisits;
              const progress = totalVisits > 0 ? (usedVisits / totalVisits) * 100 : 0;
              const visits = sub.visits || [];
              
              return (
                <div key={sub.id} className="bg-white rounded-xl shadow p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">{sub.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <span>Used: <strong>{usedVisits}</strong></span>
                        <span>Remaining: <strong className="text-purple-600">{remaining}</strong></span>
                        <span>Total: <strong>{totalVisits}</strong></span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenRedeemModal(sub)}
                      disabled={remaining === 0}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full md:w-auto ${
                        remaining === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                      Redeem Visit
                    </button>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {visits.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Visit History:</p>
                      <div className="space-y-2">
                        {visits.slice().reverse().map((visit, idx) => {
                          // visits array from backend is sorted ASC (oldest first)
                          // When reversed, idx=0 is the most recent visit (Visit #visits.length)
                          const visitNumber = visits.length - idx;
                          
                          return (
                            <div key={visit.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-gray-700">
                                    Visit {visitNumber}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {(() => {
                                      // Extract just the date part (YYYY-MM-DD) from ISO timestamp
                                      const dateStr = visit.date.split('T')[0];
                                      // Create date in local timezone by treating it as local time
                                      const [year, month, day] = dateStr.split('-');
                                      const localDate = new Date(year, month - 1, day);
                                      return localDate.toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                      });
                                    })()}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditNote(sub.id, visit.id, visit.note, visitNumber)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                  >
                                    Edit Note
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVisit(sub.id, visit.id, visitNumber)}
                                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              {visit.note && (
                                <div className="mt-2 p-2 bg-blue-50 border-l-2 border-blue-400 rounded">
                                  <p className="text-xs text-blue-900">
                                    <span className="font-semibold">Note: </span>
                                    {visit.note}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddSubscription && (
        <AddSubscriptionModal
          onClose={() => setShowAddSubscription(false)}
          onSubmit={handleAddSubscription}
          subscriptionTypes={subscriptionTypes}
        />
      )}

      {showRedeemModal && selectedSubscriptionForRedeem && (
        <RedeemVisitModal
          onClose={() => {
            setShowRedeemModal(false);
            setSelectedSubscriptionForRedeem(null);
          }}
          onSubmit={handleRedeemVisit}
          subscriptionName={selectedSubscriptionForRedeem.name}
        />
      )}

      {/* NEW: Edit Customer Modal */}
      {showEditCustomer && (
        <EditCustomerModal
          onClose={() => setShowEditCustomer(false)}
          onSubmit={handleUpdateCustomer}
          customer={customer}
        />
      )}

      {/* NEW: Edit Note Modal */}
      {showEditNote && editingNote && (
        <EditVisitNoteModal
          onClose={() => {
            setShowEditNote(false);
            setEditingNote(null);
          }}
          onSubmit={handleUpdateNote}
          currentNote={editingNote.currentNote}
          visitNumber={editingNote.visitNumber}
        />
      )}
    </div>
  );
}
// ===================================================================
// END: MODIFIED CUSTOMER DETAIL VIEW
// ===================================================================


export default function SalonApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [salonId, setSalonId] = useState(null);
  const [salonName, setSalonName] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      setUserRole(parsedUser.role);
      setSalonId(parsedUser.salon_id);
      setSalonName(parsedUser.salon_name);
    }
  }, []);

  const handleLogin = (role, user, salId, salName) => {
    setUserRole(role);
    setCurrentUser(user);
    setSalonId(salId);
    setSalonName(salName);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('salon_id');
    localStorage.removeItem('salon_name');
    setCurrentUser(null);
    setUserRole(null);
    setSalonId(null);
    setSalonName(null);
    setSelectedCustomer(null);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (showDashboard) {
    return <Dashboard onBack={() => setShowDashboard(false)} />;
  }

  // Only show Owner Portal - Customer login has been removed
  return (
    <OwnerPortal
      customers={customers}
      setCustomers={setCustomers}
      selectedCustomer={selectedCustomer}
      setSelectedCustomer={setSelectedCustomer}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      showAddCustomer={showAddCustomer}
      setShowAddCustomer={setShowAddCustomer}
      setShowDashboard={setShowDashboard}
      onLogout={handleLogout}
    />
  );
}