import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, CheckCircle, Clock, X, AlertCircle, Settings, ChevronRight, User } from 'lucide-react';
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
  const [salonTimezone, setSalonTimezone] = useState('UTC');
  const [expandedId, setExpandedId] = useState(null);

  const statuses = ['PENDING', 'CONFIRMED', 'RESCHEDULE_PROPOSED', 'CANCELLED'];

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await appointmentsAPI.getForOwner(selectedStatus);
      setAppointments(response.data.appointments || []);
      if (response.data.salonTimezone) {
        setSalonTimezone(response.data.salonTimezone);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch appointments';
      setError(errorMsg);
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchAppointments();
    } else {
      setError('Authentication required. Please log in again.');
    }
  }, [fetchAppointments]);

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

  // Format date components
  const formatDate = (dateString) => {
    if (!dateString) return { day: '', month: '', year: '', time: '' };
    const date = new Date(dateString);
    
    return {
      day: date.toLocaleDateString('en-US', { timeZone: salonTimezone, day: 'numeric' }),
      month: date.toLocaleDateString('en-US', { timeZone: salonTimezone, month: 'short' }).toUpperCase(),
      year: date.toLocaleDateString('en-US', { timeZone: salonTimezone, year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', {
        timeZone: salonTimezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return { class: 'status-pending', label: 'Pending' };
      case 'CONFIRMED':
        return { class: 'status-confirmed', label: 'Confirmed' };
      case 'RESCHEDULE_PROPOSED':
        return { class: 'status-proposed', label: 'Proposed' };
      case 'CANCELLED':
        return { class: 'status-cancelled', label: 'Cancelled' };
      default:
        return { class: 'status-default', label: status };
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

      <div className="status-pills">
        {statuses.map(status => (
          <button
            key={status}
            className={`status-pill ${selectedStatus === status ? 'active' : ''}`}
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
        <div className="appointments-list-view">
          {appointments.map(apt => {
            const dateInfo = formatDate(apt.requested_time);
            const proposedDateInfo = apt.proposed_time ? formatDate(apt.proposed_time) : null;
            const statusBadge = getStatusBadge(apt.status);
            const isExpanded = expandedId === apt.id;

            return (
              <div key={apt.id} className={`appointment-row ${isExpanded ? 'expanded' : ''}`}>
                <div className="row-main" onClick={() => setExpandedId(isExpanded ? null : apt.id)}>
                  {/* Date Box */}
                  <div className="date-box">
                    <div className="date-day">{dateInfo.day}</div>
                    <div className="date-month">{dateInfo.month}</div>
                  </div>

                  {/* Main Info */}
                  <div className="row-info">
                    <div className="info-primary">
                      <User size={16} className="customer-icon" />
                      <span className="customer-name">{apt.customer_name}</span>
                      <span className={`status-badge ${statusBadge.class}`}>{statusBadge.label}</span>
                    </div>
                    <div className="info-secondary">
                      <span className="service-name">{apt.subscription_type || 'Appointment'}</span>
                      <span className="dot">•</span>
                      <span className="appointment-time">{dateInfo.time}</span>
                      {apt.customer_phone && (
                        <>
                          <span className="dot">•</span>
                          <span className="phone">{apt.customer_phone}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <div className="row-action">
                    <ChevronRight className={`chevron-icon ${isExpanded ? 'rotated' : ''}`} size={20} />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="row-expanded">
                    <div className="expanded-section">
                      <div className="section-label">Customer Email</div>
                      <div className="section-value">{apt.customer_email}</div>
                    </div>

                    {proposedDateInfo && (
                      <div className="expanded-section">
                        <div className="section-label">Proposed New Time</div>
                        <div className="section-value proposed-time">
                          {proposedDateInfo.month} {proposedDateInfo.day}, {proposedDateInfo.year} at {proposedDateInfo.time}
                        </div>
                      </div>
                    )}

                    {apt.notes && (
                      <div className="expanded-section">
                        <div className="section-label">Customer Notes</div>
                        <div className="section-value">{apt.notes}</div>
                      </div>
                    )}

                    <div className="expanded-actions">
                      {apt.status === 'PENDING' && (
                        <>
                          <button
                            className="action-btn btn-confirm"
                            onClick={(e) => { e.stopPropagation(); handleConfirm(apt.id); }}
                          >
                            <CheckCircle size={16} />
                            Confirm
                          </button>
                          <button
                            className="action-btn btn-propose"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(apt);
                              setProposingTime(true);
                            }}
                          >
                            <Clock size={16} />
                            Propose New Time
                          </button>
                        </>
                      )}

                      {apt.status === 'RESCHEDULE_PROPOSED' && (
                        <div className="info-alert">
                          <AlertCircle size={16} />
                          Waiting for customer to accept proposed time
                        </div>
                      )}

                      {(apt.status === 'PENDING' || apt.status === 'CONFIRMED' || apt.status === 'RESCHEDULE_PROPOSED') && (
                        <button
                          className="action-btn btn-cancel"
                          onClick={(e) => { e.stopPropagation(); handleCancel(apt.id); }}
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {proposingTime && selectedAppointment && (
        <div className="modal-overlay" onClick={() => {
          setProposingTime(false);
          setProposedDateTime('');
          setSelectedAppointment(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Propose New Time</h2>
            <p><strong>Customer:</strong> {selectedAppointment.customer_name}</p>
            <p><strong>Original Time:</strong> {formatDate(selectedAppointment.requested_time).month} {formatDate(selectedAppointment.requested_time).day}, {formatDate(selectedAppointment.requested_time).time}</p>

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
