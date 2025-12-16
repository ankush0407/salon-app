import React, { useState, useCallback, useEffect } from 'react';
import { User, Package, Plus, Check, Calendar, X } from 'lucide-react';
import { subscriptionsAPI, subscriptionTypesAPI, customersAPI } from '../services/api';
import { 
    AddSubscriptionModal, 
    RedeemVisitModal, 
    EditCustomerModal, 
    EditVisitNoteModal 
} from './modals';


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
                                    {new Date(visit.date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    timeZone: 'America/Los_Angeles' // Optional: Ensures it stays in PST regardless of where the user is
  })}
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
  
        {showEditCustomer && (
          <EditCustomerModal
            onClose={() => setShowEditCustomer(false)}
            onSubmit={handleUpdateCustomer}
            customer={customer}
          />
        )}
  
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

  export default CustomerDetailView;