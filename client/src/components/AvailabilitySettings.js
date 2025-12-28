import React, { useState, useEffect } from 'react';
import { Calendar, Save, AlertCircle, ArrowLeft } from 'lucide-react';
import { availabilityAPI } from '../services/api';
import './AvailabilitySettings.css';

function AvailabilitySettings({ onBack }) {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
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

      <div className="availability-table">
        <div className="table-header">
          <div className="col-day">Day</div>
          <div className="col-working">Working</div>
          <div className="col-time">Start Time</div>
          <div className="col-time">End Time</div>
          <div className="col-duration">Slot Duration (min)</div>
        </div>

        <div className="table-body">
          {availability.map((item, index) => (
            <div key={item.dayOfWeek} className="table-row">
              <div className="col-day">
                <span className="day-label">{item.dayName}</span>
              </div>
              
              <div className="col-working">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={item.isWorkingDay}
                    onChange={(e) => handleAvailabilityChange(index, 'isWorkingDay', e.target.checked)}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                </label>
              </div>

              <div className="col-time">
                <input
                  type="time"
                  value={item.startTime || ''}
                  onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)}
                  disabled={!item.isWorkingDay}
                  className="time-input"
                />
              </div>

              <div className="col-time">
                <input
                  type="time"
                  value={item.endTime || ''}
                  onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)}
                  disabled={!item.isWorkingDay}
                  className="time-input"
                />
              </div>

              <div className="col-duration">
                <select
                  value={item.slotDuration}
                  onChange={(e) => handleAvailabilityChange(index, 'slotDuration', e.target.value)}
                  disabled={!item.isWorkingDay}
                  className="duration-select"
                >
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                  <option value="60">60</option>
                  <option value="90">90</option>
                  <option value="120">120</option>
                </select>
              </div>
            </div>
          ))}
        </div>
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
        <h3>About Availability Settings</h3>
        <ul>
          <li>Check "Working" to mark a day when your salon is open</li>
          <li>Set your operating hours (Start Time and End Time)</li>
          <li>Choose appointment slot duration to divide your working hours into bookable slots</li>
          <li>Customers will only see available slots on working days during your hours</li>
          <li>Confirmed appointments will not show as available for booking</li>
        </ul>
      </div>
    </div>
  );
}

export default AvailabilitySettings;
