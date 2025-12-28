import React, { useState, useEffect } from 'react';
import { Upload, Save, AlertCircle, CheckCircle, Loader, Download, X } from 'lucide-react';
import api from '../services/api';
import './Profile.css';

function Profile() {
  // Profile form state
  const [salonName, setSalonName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [salonImage, setSalonImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  // Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [invoices, setInvoices] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfileData();
    fetchInvoices();
    
    // Check if user just completed a payment (redirect from Stripe)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success')) {
      setMessage({
        type: 'success',
        text: '✓ Payment successful! Syncing invoices...'
      });
      
      // First, sync the Stripe customer ID
      const syncCustomer = async () => {
        try {
          const syncResponse = await api.post('/profile/sync-stripe-customer');
          
          // Then refresh invoices
          setTimeout(() => {
            fetchProfileData();
            fetchInvoices();
            setMessage({
              type: 'success',
              text: '✓ Payment successful! Invoice is being processed.'
            });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            
            // If this is a new tab opened by Stripe, close it after 2 seconds
            setTimeout(() => {
              if (window.opener) {
                console.log('🪟 Closing payment tab and returning to parent window...');
                window.opener.focus();
                window.close();
              }
            }, 2000);
          }, 1000);
        } catch (error) {
          console.error('❌ Frontend: Error syncing customer:', error);
          console.error('   Response:', error.response?.data);
          console.error('   Status:', error.response?.status);
          // Still try to refresh invoices even if sync fails
          setTimeout(() => {
            fetchProfileData();
            fetchInvoices();
          }, 2000);
        }
      };
      
      syncCustomer();
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profile');
      setSalonName(response.data.name);
      setPhone(response.data.phone || '');
      setEmail(response.data.email || '');
      setCurrentImageUrl(response.data.salon_image_url || '');
      setSubscriptionStatus(response.data.subscription_status || 'inactive');
      setMessage({ type: '', text: '' });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to load profile data'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const response = await api.get('/profile/invoices');
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      // Invoices are optional, don't show error
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleRefreshInvoices = async () => {
    await fetchInvoices();
    setMessage({
      type: 'success',
      text: '✓ Invoices refreshed!'
    });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSalonImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!salonName.trim()) {
      setMessage({ type: 'error', text: 'Salon name is required' });
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', salonName);
      formData.append('phone', phone);
      formData.append('email', email);
      
      if (salonImage) {
        formData.append('salonImage', salonImage);
      } else if (currentImageUrl) {
        formData.append('salon_image_url', currentImageUrl);
      }

      const response = await api.put('/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSalonName(response.data.name);
      setPhone(response.data.phone || '');
      setEmail(response.data.email || '');
      setCurrentImageUrl(response.data.salon_image_url || '');
      setSalonImage(null);
      setImagePreview('');

      setMessage({
        type: 'success',
        text: '✓ Profile updated successfully!'
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update profile'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      // Find the invoice to get the PDF URL from Stripe
      const invoice = invoices.find(inv => inv.id === invoiceId);
      
      if (!invoice || !invoice.pdfUrl) {
        setMessage({
          type: 'error',
          text: 'Invoice PDF URL not available'
        });
        return;
      }

      // Open Stripe PDF in new tab (user can save/download from there)
      // This is more efficient than downloading through our server
      window.open(invoice.pdfUrl, '_blank');
      
      setMessage({
        type: 'success',
        text: '✓ Opening invoice PDF in new tab...'
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      setMessage({
        type: 'error',
        text: 'Failed to download invoice'
      });
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">
          <Loader className="spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Business Profile</h1>
        <p>Manage your salon details and subscription</p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          <div className="alert-content">
            {message.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="profile-layout">
        {/* Left Column - Profile Details */}
        <div className="profile-section profile-main">
          <h2>Salon Details</h2>
          
          {/* Image Upload Section */}
          <div className="image-upload-section">
            <div className="image-preview-container">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="remove-preview-btn"
                    onClick={() => {
                      setSalonImage(null);
                      setImagePreview('');
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : currentImageUrl ? (
                <div className="image-preview">
                  <img src={currentImageUrl} alt="Salon" />
                </div>
              ) : (
                <div className="image-placeholder">
                  <Upload size={40} />
                  <p>No image uploaded</p>
                </div>
              )}
            </div>

            <label className="file-input-label">
              <Upload size={18} />
              <span>Upload Salon Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden-file-input"
              />
            </label>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="profile-form">
            <div className="form-group">
              <label htmlFor="salonName">Salon Name *</label>
              <input
                type="text"
                id="salonName"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                placeholder="Enter salon name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader size={18} className="spinner-small" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column - Subscription & Invoices */}
        <div className="profile-sidebar">
          {/* Subscription Section */}
          <div className="subscription-card">
            <div className="subscription-header">
              <h3>Subscription Plan</h3>
              <span className={`status-badge status-${subscriptionStatus}`}>
                {subscriptionStatus === 'active' ? '✓ Active' : '○ Inactive'}
              </span>
            </div>

            <div className="subscription-content">
              <p className="subscription-desc">
                {subscriptionStatus === 'active'
                  ? 'Your subscription is active and billing is up to date.'
                  : 'Subscribe now to unlock all features and start managing your salon efficiently.'}
              </p>
              
              {/* Stripe Buy Button */}
              <div className="stripe-buy-button-container">
                <stripe-buy-button
                  buy-button-id={process.env.REACT_APP_STRIPE_BUY_BUTTON_ID}
                  publishable-key={process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY}
                >
                </stripe-buy-button>
              </div>
              <p className="payment-note">
                You will be redirected back to this page after a successful payment.
              </p>
            </div>
          </div>

          {/* Invoices Section */}
          <div className="invoices-card">
            <div className="invoices-header">
              <h3>Invoice History</h3>
              <button
                className="btn-refresh-invoices"
                onClick={handleRefreshInvoices}
                disabled={loadingInvoices}
                title="Refresh invoices"
              >
                <Loader size={16} className={loadingInvoices ? 'spinner' : ''} />
              </button>
            </div>
            
            {loadingInvoices ? (
              <div className="loading-invoices">
                <Loader size={20} className="spinner" />
                <p>Loading invoices...</p>
              </div>
            ) : invoices.length > 0 ? (
              <div className="invoices-list">
                {invoices.map((invoice) => {
                  const invoiceDate = new Date(invoice.date);
                  const monthName = invoiceDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  });
                  const fullDate = invoiceDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                  
                  return (
                    <div key={invoice.id} className="invoice-item">
                      <div className="invoice-info">
                        <p className="invoice-month">{monthName}</p>
                        <p className="invoice-date">{fullDate}</p>
                        <p className="invoice-amount">${(invoice.amount / 100).toFixed(2)}</p>
                      </div>
                      <div className="invoice-status">
                        <span className={`status status-${invoice.status.toLowerCase()}`}>
                          {invoice.status === 'paid' ? '✓ Paid' : 'Pending'}
                        </span>
                      </div>
                      <button
                        className="btn-download"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        title="Download invoice PDF from Stripe"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-invoices">
                <p>No invoices yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedInvoice(null)}
            >
              <X size={24} />
            </button>
            <iframe
              src={selectedInvoice.url}
              title="Invoice"
              className="invoice-preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
