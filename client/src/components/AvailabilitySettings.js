import React, { useState, useEffect } from 'react';
import { Calendar, Save, AlertCircle, ArrowLeft, ChevronRight, Clock } from 'lucide-react';
import { availabilityAPI } from '../services/api';
import './AvailabilitySettings.css';

function AvailabilitySettings({ onBack }) {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayAbbreviations = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  // Get salonId from localStorage (set during owner login)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const salonId = user.salon_id;

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!salonId) {
        setError('Salon ID not found');
        return;
      }

      const response = await availabilityAPI.getForSalon(salonId);
      
      if (response.data.availability && response.data.availability.length > 0) {
        setAvailability(response.data.availability);
      } else {
        // Initialize default availability structure
        const defaultAvailability = [];
        for (let i = 0; i < 7; i++) {
          defaultAvailability.push({
            id: null,
            salonId,
            dayOfWeek: i,
            dayName: dayNames[i],
            isWorkingDay: i >= 1 && i <= 5, // Mon-Fri
            startTime: i >= 1 && i <= 5 ? '09:00' : '',
            endTime: i >= 1 && i <= 5 ? '17:00' : '',
            slotDuration: 30
          });
        }
        setAvailability(defaultAvailability);
      }
    } catch (err) {
      setError('Failed to fetch availability settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = (index, field, value) => {
    const updated = [...availability];
    updated[index][field] = value;
    setAvailability(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const settingsToSave = availability.map(item => ({
        dayOfWeek: item.dayOfWeek,
        isWorkingDay: item.isWorkingDay,
        startTime: item.isWorkingDay ? item.startTime : null,
        endTime: item.isWorkingDay ? item.endTime : null,
        slotDuration: parseInt(item.slotDuration) || 30
      }));

      await availabilityAPI.updateSettings(settingsToSave);
      setSuccess('Availability settings saved successfully!');
      fetchAvailability();
    } catch (err) {
      setError('Failed to save availability settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="availability-settings">
        <div className="loading">Loading availability settings...</div>
      </div>
    );
  }

  return (
    <div className="availability-settings">
      <div className="settings-header">
        {onBack && (
          <button onClick={onBack} className="back-button">
            <ArrowLeft size={20} />
            Back to Appointments
          </button>
        )}
        <h1>
          <Calendar className="header-icon" />
          Availability Settings
        </h1>
        <p className="subtitle">Set your working days, hours, and appointment slot duration</p>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="availability-list-view">
        {availability.map((item, index) => {
          const isExpanded = expandedId === item.dayOfWeek;
          
          return (
            <div key={item.dayOfWeek} className={`availability-row ${isExpanded ? 'expanded' : ''}`}>
              <div className="row-main" onClick={() => setExpandedId(isExpanded ? null : item.dayOfWeek)}>
                {/* Day Box */}
                <div className="day-box">
                  <div className="day-abbr">{dayAbbreviations[item.dayOfWeek]}</div>
                </div>

                {/* Main Info */}
                <div className="row-info">
                  <div className="info-primary">
                    <span className="day-name">{item.dayName}</span>
                    <span className={`status-badge ${item.isWorkingDay ? 'status-open' : 'status-closed'}`}>
                      {item.isWorkingDay ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <div className="info-secondary">
                    {item.isWorkingDay && item.startTime && item.endTime ? (
                      <>
                        <Clock size={14} />
                        <span className="time-range">{item.startTime} - {item.endTime}</span>
                        <span className="dot">•</span>
                        <span className="slot-duration">{item.slotDuration} min slots</span>
                      </>
                    ) : (
                      <span className="no-hours">No working hours set</span>
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
                    <div className="section-label">Working Day</div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={item.isWorkingDay}
                        onChange={(e) => handleAvailabilityChange(index, 'isWorkingDay', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">{item.isWorkingDay ? 'Open' : 'Closed'}</span>
                    </label>
                  </div>

                  {item.isWorkingDay && (
                    <>
                      <div className="expanded-section">
                        <div className="section-label">Start Time</div>
                        <input
                          type="time"
                          value={item.startTime || ''}
                          onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)}
                          className="time-input"
                        />
                      </div>

                      <div className="expanded-section">
                        <div className="section-label">End Time</div>
                        <input
                          type="time"
                          value={item.endTime || ''}
                          onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)}
                          className="time-input"
                        />
                      </div>

                      <div className="expanded-section">
                        <div className="section-label">Appointment Duration (minutes)</div>
                        <select
                          value={item.slotDuration}
                          onChange={(e) => handleAvailabilityChange(index, 'slotDuration', e.target.value)}
                          className="duration-select"
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="45">45 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="90">1.5 hours</option>
                          <option value="120">2 hours</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="settings-footer">
        <button
          className="save-button"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="info-box">
        <AlertCircle size={18} />
        <div className="info-content">
          <h3>About Availability Settings</h3>
          <p>Click on any day to expand and set your working hours and appointment slot duration. Customers can only book appointments during your configured working hours.</p>
        </div>
      </div>
    </div>
  );
}

export default AvailabilitySettings;
