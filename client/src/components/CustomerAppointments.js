import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, CheckCircle, Clock, X, AlertCircle, ChevronRight, MoreVertical } from 'lucide-react';
import { appointmentsAPI } from '../services/api';
import './CustomerAppointments.css';

function CustomerAppointments({ customerId }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, reschedule_proposed
  const [expandedId, setExpandedId] = useState(null);

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

  // Format date components
  const formatDate = (dateString, salonTz) => {
    if (!dateString) return { day: '', month: '', year: '', time: '' };
    const timezone = salonTz || 'UTC';
    const date = new Date(dateString);
    
    return {
      day: date.toLocaleDateString('en-US', { timeZone: timezone, day: 'numeric' }),
      month: date.toLocaleDateString('en-US', { timeZone: timezone, month: 'short' }).toUpperCase(),
      year: date.toLocaleDateString('en-US', { timeZone: timezone, year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', {
        timeZone: timezone,
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

      <div className="filter-pills">
        {[{ value: 'all', label: 'All' }, 
          { value: 'pending', label: 'Pending' }, 
          { value: 'confirmed', label: 'Confirmed' }, 
          { value: 'reschedule_proposed', label: 'Proposed' }].map(tab => (
          <button
            key={tab.value}
            className={`filter-pill ${filter === tab.value ? 'active' : ''}`}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading appointments...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="no-appointments">
          <Clock size={48} />
          <p>No appointments {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
        </div>
      ) : (
        <div className="appointments-list-view">
          {filteredAppointments.map(apt => {
            const dateInfo = formatDate(apt.requested_time, apt.salon_timezone);
            const proposedDateInfo = apt.proposed_time ? formatDate(apt.proposed_time, apt.salon_timezone) : null;
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
                      <span className="salon-name">{apt.salon_name}</span>
                      <span className={`status-badge ${statusBadge.class}`}>{statusBadge.label}</span>
                    </div>
                    <div className="info-secondary">
                      <span className="service-name">{apt.subscription_type || 'Appointment'}</span>
                      <span className="dot">•</span>
                      <span className="appointment-time">{dateInfo.time}</span>
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
                        <div className="section-label">Notes</div>
                        <div className="section-value">{apt.notes}</div>
                      </div>
                    )}

                    <div className="expanded-actions">
                      {apt.status === 'RESCHEDULE_PROPOSED' && (
                        <>
                          <button
                            className="action-btn btn-accept"
                            onClick={(e) => { e.stopPropagation(); handleAcceptProposal(apt.id); }}
                          >
                            <CheckCircle size={16} />
                            Accept New Time
                          </button>
                          <button
                            className="action-btn btn-cancel"
                            onClick={(e) => { e.stopPropagation(); handleCancel(apt.id); }}
                          >
                            <X size={16} />
                            Decline
                          </button>
                        </>
                      )}

                      {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                        <button
                          className="action-btn btn-cancel"
                          onClick={(e) => { e.stopPropagation(); handleCancel(apt.id); }}
                        >
                          <X size={16} />
                          Cancel Appointment
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
    </div>
  );
}

export default CustomerAppointments;
