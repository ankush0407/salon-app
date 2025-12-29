import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, CheckCircle, Clock, X, AlertCircle } from 'lucide-react';
import { appointmentsAPI } from '../services/api';
import './CustomerAppointments.css';

function CustomerAppointments({ customerId }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, reschedule_proposed

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await appointmentsAPI.getForCustomer(customerId);
      setAppointments(response.data.appointments || []);
    } catch (err) {
      setError('Failed to fetch appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleAcceptProposal = async (appointmentId) => {
    try {
      await appointmentsAPI.acceptProposal(appointmentId);
      fetchAppointments();
    } catch (err) {
      setError('Failed to accept proposal');
      console.error(err);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentsAPI.cancel(appointmentId);
        fetchAppointments();
      } catch (err) {
        setError('Failed to cancel appointment');
        console.error(err);
      }
    }
  };

  // Format date/time in salon's timezone (same pattern as BookingModal)
  const formatDateTime = (dateString, salonTz) => {
    if (!dateString) return '';
    const timezone = salonTz || 'UTC';
    const date = new Date(dateString);
    
    const dateStr = date.toLocaleDateString('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const timeStr = date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return `${dateStr}, ${timeStr}`;
  };

  const getStatusBadgeClass = (status) => {
    const baseClass = 'status-badge';
    switch (status) {
      case 'PENDING':
        return `${baseClass} pending`;
      case 'CONFIRMED':
        return `${baseClass} confirmed`;
      case 'RESCHEDULE_PROPOSED':
        return `${baseClass} proposed`;
      case 'CANCELLED':
        return `${baseClass} cancelled`;
      default:
        return baseClass;
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter.toUpperCase();
  });

  return (
    <div className="customer-appointments">
      <div className="appointments-header">
        <h1>
          <Calendar className="header-icon" />
          My Appointments
        </h1>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="filter-tabs">
        {['all', 'pending', 'confirmed', 'reschedule_proposed'].map(status => (
          <button
            key={status}
            className={`filter-tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status === 'reschedule_proposed' ? 'Proposed' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading appointments...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="no-appointments">
          <Clock size={48} />
          <p>No appointments {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
          <p className="subtitle">Book an appointment from your subscription detail view</p>
        </div>
      ) : (
        <div className="appointments-grid">
          {filteredAppointments.map(apt => (
            <div key={apt.id} className="appointment-card">
              <div className="card-header">
                <div>
                  <h3>{apt.salon_name}</h3>
                  {apt.subscription_type && (
                    <p className="subscription">{apt.subscription_type}</p>
                  )}
                </div>
                <span className={getStatusBadgeClass(apt.status)}>
                  {apt.status === 'RESCHEDULE_PROPOSED' ? 'Proposed' : apt.status}
                </span>
              </div>

              <div className="appointment-details">
                <div className="detail-item">
                  <span className="label">Requested Time:</span>
                  <span className="value">{formatDateTime(apt.requested_time, apt.salon_timezone)}</span>
                </div>

                {apt.proposed_time && (
                  <div className="detail-item">
                    <span className="label">Proposed Time:</span>
                    <span className="value proposed">{formatDateTime(apt.proposed_time, apt.salon_timezone)}</span>
                  </div>
                )}

                {apt.status === 'CONFIRMED' && (
                  <div className="confirmed-tag">
                    <CheckCircle size={16} />
                    Confirmed
                  </div>
                )}
              </div>

              {apt.notes && (
                <div className="appointment-notes">
                  <strong>Your Notes:</strong> {apt.notes}
                </div>
              )}

              <div className="card-actions">
                {apt.status === 'RESCHEDULE_PROPOSED' && (
                  <>
                    <button
                      className="action-btn accept-btn"
                      onClick={() => handleAcceptProposal(apt.id)}
                    >
                      <CheckCircle size={16} />
                      Accept New Time
                    </button>
                    <button
                      className="action-btn cancel-btn"
                      onClick={() => handleCancel(apt.id)}
                    >
                      <X size={16} />
                      Decline
                    </button>
                  </>
                )}

                {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                  <button
                    className="action-btn cancel-btn"
                    onClick={() => handleCancel(apt.id)}
                  >
                    <X size={16} />
                    Cancel Appointment
                  </button>
                )}
              </div>

              <div className="card-footer">
                <small>Created {new Date(apt.created_at).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomerAppointments;
