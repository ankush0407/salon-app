import React, { useState, useEffect } from 'react';
import { subscriptionTypesAPI } from '../services/api';
import { ManageSubscriptionTypesModal } from './modals';
import { Plus } from 'lucide-react';

function Subscriptions() {
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManageTypes, setShowManageTypes] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const typesRes = await subscriptionTypesAPI.getAll();
        setSubscriptionTypes(typesRes.data);
      } catch (error) {
        console.error('Error loading subscription types:', error);
        alert('Failed to load subscription types.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddSubscriptionType = async (typeData) => {
    const response = await subscriptionTypesAPI.create(typeData);
    setSubscriptionTypes([...subscriptionTypes, response.data]);
  };

  const handleDeleteSubscriptionType = async (typeId) => {
    await subscriptionTypesAPI.delete(typeId);
    setSubscriptionTypes(subscriptionTypes.filter((t) => t.id !== typeId));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Subscription Types</h1>
        <button
          onClick={() => setShowManageTypes(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Manage Types
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        {subscriptionTypes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No subscription types yet. Add one to get started!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptionTypes.map((type) => (
              <div key={type.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{type.name}</h3>
                <p>Price: ${type.price}</p>
                <p>Visits: {type.visits}</p>
              </div>
            ))}
          </div>
        )}
      </div>

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

export default Subscriptions;

