import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, X, AlertCircle, Settings } from 'lucide-react';
import { appointmentsAPI } from '../services/api';
import './AppointmentsManager.css';

function AppointmentsManager({ onOpenSettings }) {
  const [appointments, setAppointments] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('PENDING');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [proposingTime, setProposingTime] = useState(false);
  const [proposedDateTime, setProposedDateTime] = useState('');

  const statuses = ['PENDING', 'CONFIRMED', 'RESCHEDULE_PROPOSED', 'CANCELLED'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchAppointments();
    } else {
      setError('Authentication required. Please log in again.');
    }
  }, [selectedStatus]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await appointmentsAPI.getForOwner(selectedStatus);
      setAppointments(response.data.appointments || []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch appointments';
      setError(errorMsg);
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (appointmentId) => {
    try {
      await appointmentsAPI.confirm(appointmentId);
      fetchAppointments();
    } catch (err) {
      setError('Failed to confirm appointment');
      console.error(err);
    }
  };

  const handleProposeTime = async (appointmentId) => {
    if (!proposedDateTime) {
      setError('Please select a date and time');
      return;
    }

    try {
      await appointmentsAPI.proposeNewTime(appointmentId, new Date(proposedDateTime).toISOString());
      setProposingTime(false);
      setProposedDateTime('');
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err) {
      setError('Failed to propose new time');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="appointments-manager">
      <div className="appointments-header">
        <h1>
          <Calendar className="header-icon" />
          Appointments
        </h1>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="settings-button"
            title="Configure availability settings"
          >
            <Settings size={20} />
            Availability Settings
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="status-tabs">
        {statuses.map(status => (
          <button
            key={status}
            className={`status-tab ${selectedStatus === status ? 'active' : ''}`}
            onClick={() => setSelectedStatus(status)}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="no-appointments">
          <Clock size={48} />
          <p>No {selectedStatus.toLowerCase().replace('_', ' ')} appointments</p>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map(apt => (
            <div key={apt.id} className="appointment-card">
              <div className="appointment-header">
                <div className="appointment-info">
                  <h3>{apt.customer_name}</h3>
                  <p className="customer-contact">
                    {apt.customer_email} {apt.customer_phone && `• ${apt.customer_phone}`}
                  </p>
                </div>
                <span className={getStatusBadgeClass(apt.status)}>
                  {apt.status.replace('_', ' ')}
                </span>
              </div>

              {apt.subscription_type && (
                <p className="subscription-type">
                  Subscription: <strong>{apt.subscription_type}</strong>
                </p>
              )}

              <div className="appointment-times">
                <div className="time-item">
                  <span className="label">Requested:</span>
                  <span className="time">{formatDate(apt.requested_time)}</span>
                </div>

                {apt.proposed_time && (
                  <div className="time-item">
                    <span className="label">Proposed:</span>
                    <span className="time proposed">{formatDate(apt.proposed_time)}</span>
                  </div>
                )}
              </div>

              {apt.notes && (
                <div className="appointment-notes">
                  <strong>Notes:</strong> {apt.notes}
                </div>
              )}

              <div className="appointment-actions">
                {apt.status === 'PENDING' && (
                  <>
                    <button
                      className="action-btn confirm-btn"
                      onClick={() => handleConfirm(apt.id)}
                    >
                      <CheckCircle size={18} />
                      Confirm
                    </button>
                    <button
                      className="action-btn propose-btn"
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setProposingTime(true);
                      }}
                    >
                      Propose New Time
                    </button>
                  </>
                )}

                {apt.status === 'RESCHEDULE_PROPOSED' && (
                  <p className="info-text">
                    Waiting for customer to accept proposed time: {formatDate(apt.proposed_time)}
                  </p>
                )}

                {(apt.status === 'PENDING' || apt.status === 'CONFIRMED' || apt.status === 'RESCHEDULE_PROPOSED') && (
                  <button
                    className="action-btn cancel-btn"
                    onClick={() => handleCancel(apt.id)}
                  >
                    <X size={18} />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {proposingTime && selectedAppointment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Propose New Time</h2>
            <p>Customer: {selectedAppointment.customer_name}</p>
            <p>Original Time: {formatDate(selectedAppointment.requested_time)}</p>

            <div className="form-group">
              <label htmlFor="proposed-datetime">New Date & Time</label>
              <input
                type="datetime-local"
                id="proposed-datetime"
                value={proposedDateTime}
                onChange={(e) => setProposedDateTime(e.target.value)}
                className="datetime-input"
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => handleProposeTime(selectedAppointment.id)}
              >
                Send Proposal
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setProposingTime(false);
                  setProposedDateTime('');
                  setSelectedAppointment(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentsManager;
