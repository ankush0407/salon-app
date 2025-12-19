import React, { useState, useEffect } from 'react';
import { User, Package, Plus, Search, ChevronRight, PieChart } from 'lucide-react';
import { customersAPI, subscriptionTypesAPI } from '../services/api';
import CustomerDetailView from './CustomerDetailView';
import { AddCustomerModal, ManageSubscriptionTypesModal } from './modals';

function OwnerPortal({ onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
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
  }, []);

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
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Customer Management</h2>
              <p className="text-gray-600">Manage subscriptions and track visits</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
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

export default OwnerPortal;