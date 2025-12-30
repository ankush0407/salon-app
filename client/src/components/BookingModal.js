import React, { useState, useEffect, useCallback } from 'react';
import { Clock, X, AlertCircle, CheckCircle } from 'lucide-react';
import { appointmentsAPI } from '../services/api';
import './BookingModal.css';

function BookingModal({ isOpen, onClose, subscription, customerId, salonId }) {
  const [slots, setSlots] = useState([]);
  const [salonTimezone, setSalonTimezone] = useState('UTC');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchAvailableSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate salonId before making the request
      if (!salonId) {
        setError('Salon information is missing. Please refresh and try again.');
        setLoading(false);
        return;
      }
      
      const response = await appointmentsAPI.getAvailableSlots(salonId, 60);
      setSlots(response.data.slots || []);
      setSalonTimezone(response.data.salonTimezone || 'UTC');
    } catch (err) {
      setError('Failed to fetch available slots. Please try again.');
      console.error('Error details:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableSlots();
    }
  }, [isOpen, fetchAvailableSlots]);

  if (!isOpen) {
    return null;
  }

  const handleBooking = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await appointmentsAPI.create({
        customerId,
        salonId,
        subscriptionId: subscription.id,
        requestedTime: new Date(selectedSlot).toISOString(),
        notes: notes || null
      });

      setSuccess('Booking request sent! The salon owner will confirm your appointment.');
      setTimeout(() => {
        setNotes('');
        setSelectedSlot(null);
        setSuccess('');
        onClose();
      }, 2000);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('This slot is no longer available. Please select another time.');
      } else {
        setError('Failed to create booking. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const groupedSlots = slots.reduce((acc, slot) => {
    // Parse the UTC time and convert to salon's timezone for proper grouping
    const date = new Date(slot.time);
    // Format date in salon's timezone to get the correct day
    const dateKey = date.toLocaleDateString('en-CA', { timeZone: salonTimezone });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedSlots).sort();
  const filteredDates = sortedDates.filter(date => {
    const slotDate = new Date(date);
    return slotDate.getMonth() === currentMonth.getMonth() &&
           slotDate.getFullYear() === currentMonth.getFullYear();
  });

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      timeZone: salonTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    // dateString is now in YYYY-MM-DD format from toLocaleDateString('en-CA')
    // Parse it as a local date (not UTC) to match the browser's interpretation
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  if (!isOpen) return null;

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal">
        <div className="modal-header">
          <h2>Book an Appointment</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {success && (
          <div className="success-message">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {subscription && (
          <div className="subscription-info">
            <p><strong>Subscription:</strong> {subscription.name}</p>
            <p><strong>Visits Included:</strong> {subscription.totalVisits}</p>
          </div>
        )}

        <div className="booking-content">
          {loading ? (
            <div className="loading">Loading available slots...</div>
          ) : sortedDates.length === 0 ? (
            <div className="no-slots">
              <Clock size={48} />
              <p>No available slots at this time</p>
              <p className="subtitle">Please contact the salon directly or check back later</p>
            </div>
          ) : (
            <>
              <div className="calendar-section">
                <div className="month-navigation">
                  <button onClick={previousMonth} className="nav-btn">←</button>
                  <h3>
                    {currentMonth.toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h3>
                  <button onClick={nextMonth} className="nav-btn">→</button>
                </div>

                {filteredDates.length === 0 ? (
                  <div className="no-slots-month">
                    <p>No available slots in {currentMonth.toLocaleDateString('en-US', { month: 'long' })}</p>
                  </div>
                ) : (
                  <div className="dates-grid">
                    {filteredDates.map(date => (
                      <div key={date} className="date-group">
                        <div className="date-label">{formatDate(date)}</div>
                        <div className="times-grid">
                          {groupedSlots[date].map((slot, index) => (
                            <button
                              key={`${date}-${index}`}
                              className={`time-slot ${selectedSlot === slot.time ? 'selected' : ''}`}
                              onClick={() => setSelectedSlot(slot.time)}
                            >
                              {formatTime(slot.time)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="notes-section">
                <label htmlFor="notes">Add a Note (Optional)</label>
                <textarea
                  id="notes"
                  placeholder="e.g., 'Need a haircut and color', 'First time customer'"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="notes-input"
                  maxLength={200}
                />
                <p className="char-count">{notes.length}/200</p>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleBooking}
            disabled={!selectedSlot || loading}
          >
            {loading ? 'Booking...' : 'Request Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
