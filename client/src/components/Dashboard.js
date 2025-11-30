import React, { useState, useEffect } from 'react';
import api from '../services/api';
import NewCustomersChart from './charts/NewCustomersChart';
import SubscriptionTypeChart from './charts/SubscriptionTypeChart';

const Dashboard = ({ onBack }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.get('/dashboard');
        setMetrics(response.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err.response?.data?.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const MetricCard = ({ title, value }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
    </div>
  );

  const ChartCard = ({ children }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
        {children}
    </div>
  )

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  if (!metrics) {
    return <div className="min-h-screen flex items-center justify-center">No metrics to display.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
       <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
          >
            ← Back to Portal
          </button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Salon Dashboard</h2>
        </div>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <MetricCard title="Total Customers" value={metrics.totalCustomers} />
            <MetricCard title="Active Subscriptions" value={metrics.activeSubscriptions} />
            <MetricCard title="New Customers (30 Days)" value={metrics.newCustomers.last30Days} />
            <MetricCard title="Revenue (30 days)" value={`$${metrics.revenue}`} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
                <ChartCard>
                    {metrics.newCustomersTrend && metrics.newCustomersTrend.length > 0 ? (
                        <NewCustomersChart data={metrics.newCustomersTrend} />
                    ) : (
                        <p>Not enough data for new customer trend.</p>
                    )}
                </ChartCard>
            </div>
            <div className="lg:col-span-2">
                <ChartCard>
                    {metrics.subscriptionTypeBreakdown && metrics.subscriptionTypeBreakdown.length > 0 ? (
                        <SubscriptionTypeChart data={metrics.subscriptionTypeBreakdown} />
                    ) : (
                        <p>No active subscriptions to display.</p>
                    )}
                </ChartCard>
            </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
