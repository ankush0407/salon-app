/**
 * Timezone utilities for backend date/time handling
 * These utilities help convert between different timezones for salon availability
 */

/**
 * Convert a Date object to a specific timezone and return the date components
 * @param {Date} date - JavaScript Date object (in any timezone)
 * @param {string} timeZone - IANA timezone string (e.g., 'America/New_York')
 * @returns {object} - Object with year, month, date, day, hours, minutes, seconds
 */
function getDateInTimezone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = {};
  formatter.formatToParts(date).forEach(({ type, value }) => {
    parts[type] = value;
  });

  return {
    year: parseInt(parts.year),
    month: parseInt(parts.month) - 1, // 0-indexed
    date: parseInt(parts.day),
    hours: parseInt(parts.hour),
    minutes: parseInt(parts.minute),
    seconds: parseInt(parts.second),
  };
}

/**
 * Get the day of week in a specific timezone
 * @param {Date} date - JavaScript Date object
 * @param {string} timeZone - IANA timezone string
 * @returns {number} - Day of week (0 = Sunday, 6 = Saturday)
 */
function getDayOfWeekInTimezone(date, timeZone) {
  // Use Intl.DateTimeFormat to get the weekday name in the timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long'
  });
  
  const weekdayName = formatter.format(date);
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return weekdays.indexOf(weekdayName);
}

/**
 * Create a Date object representing a specific time in a given timezone
 * @param {number} year - Full year
 * @param {number} month - Month (0-indexed, 0 = January)
 * @param {number} day - Day of month
 * @param {number} hours - Hours (0-23)
 * @param {number} minutes - Minutes (0-59)
 * @param {number} seconds - Seconds (0-59)
 * @param {string} timeZone - IANA timezone string
 * @returns {Date} - UTC Date object representing that local time in the timezone
 */
function createDateInTimezone(year, month, day, hours, minutes, seconds, timeZone) {
  // Strategy: We need to find the UTC time that, when displayed in the given timezone,
  // shows year/month/day/hours/minutes/seconds.
  // 
  // We do a binary search between a reasonable range to find the correct UTC time.
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const extractParts = (date) => {
    const parts = {};
    formatter.formatToParts(date).forEach(({ type, value }) => {
      parts[type] = value;
    });
    return {
      year: parseInt(parts.year),
      month: parseInt(parts.month) - 1,
      day: parseInt(parts.day),
      hours: parseInt(parts.hour),
      minutes: parseInt(parts.minute),
      seconds: parseInt(parts.second)
    };
  };

  // Start with an initial guess: the requested time as if it were UTC
  const guessMs = new Date(Date.UTC(year, month, day, hours, minutes, seconds)).getTime();
  
  // Search in a range of +/- 14 hours (covers all possible timezone offsets)
  let minMs = guessMs - 14 * 60 * 60 * 1000;
  let maxMs = guessMs + 14 * 60 * 60 * 1000;
  
  // Binary search to find the correct UTC time
  for (let i = 0; i < 50; i++) { // 50 iterations is more than enough for millisecond precision
    const midMs = Math.floor((minMs + maxMs) / 2);
    const midDate = new Date(midMs);
    const midParts = extractParts(midDate);
    
    // Compare the parts
    const targetSeconds = year * 1e10 + month * 1e8 + day * 1e6 + hours * 1e4 + minutes * 1e2 + seconds;
    const midSeconds = midParts.year * 1e10 + midParts.month * 1e8 + midParts.day * 1e6 + midParts.hours * 1e4 + midParts.minutes * 1e2 + midParts.seconds;
    
    if (midSeconds === targetSeconds) {
      // Found exact match
      return midDate;
    } else if (midSeconds < targetSeconds) {
      // Need to go forward in UTC time
      minMs = midMs + 1;
    } else {
      // Need to go backward in UTC time
      maxMs = midMs - 1;
    }
  }
  
  // Return the closest match found
  const resultMs = Math.round((minMs + maxMs) / 2);
  return new Date(resultMs);
}

/**
 * Parse a time string (HH:MM:SS or HH:MM) and apply it to a date in a specific timezone
 * @param {Date} date - Base date
 * @param {string} timeString - Time in HH:MM:SS or HH:MM format
 * @param {string} timeZone - IANA timezone string
 * @returns {Date} - UTC Date representing that time in the timezone on that date
 */
function applyTimeToDateInTimezone(date, timeString, timeZone) {
  const dateInTz = getDateInTimezone(date, timeZone);
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  
  return createDateInTimezone(
    dateInTz.year,
    dateInTz.month,
    dateInTz.date,
    hours,
    minutes || 0,
    seconds || 0,
    timeZone
  );
}

/**
 * Get the next day in a specific timezone
 * @param {Date} date - Current date
 * @param {string} timeZone - IANA timezone string
 * @returns {Date} - Date for next day at 00:00 in the timezone (as UTC)
 */
function getNextDayInTimezone(date, timeZone) {
  const dateInTz = getDateInTimezone(date, timeZone);
  
  // Calculate the next calendar day
  let nextYear = dateInTz.year;
  let nextMonth = dateInTz.month;
  let nextDay = dateInTz.date + 1;
  
  // Handle month boundaries
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Check for leap year
  const isLeapYear = (nextYear % 4 === 0 && nextYear % 100 !== 0) || (nextYear % 400 === 0);
  if (isLeapYear && nextMonth === 1) {
    daysInMonth[1] = 29;
  }
  
  // Advance day, month, year if necessary
  if (nextDay > daysInMonth[nextMonth]) {
    nextDay = 1;
    nextMonth++;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }
  }
  
  return createDateInTimezone(
    nextYear,
    nextMonth,
    nextDay,
    0,
    0,
    0,
    timeZone
  );
}

/**
 * Check if a date is before another date (timezone-aware)
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean}
 */
function isBefore(date1, date2) {
  return date1.getTime() < date2.getTime();
}

module.exports = {
  getDateInTimezone,
  getDayOfWeekInTimezone,
  createDateInTimezone,
  applyTimeToDateInTimezone,
  getNextDayInTimezone,
  isBefore,
};
