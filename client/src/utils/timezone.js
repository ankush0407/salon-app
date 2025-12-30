// List of IANA timezone strings for dropdown selection
const IANA_TIMEZONES = [
  // Americas - North America
  'America/Anchorage',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/New_York',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Caracas',
  
  // Americas - Central
  'America/El_Salvador',
  'America/Guatemala',
  'America/Honduras',
  'America/Nicaragua',
  'America/Costa_Rica',
  'America/Panama',
  
  // Americas - South America
  'America/Bogota',
  'America/Lima',
  'America/Cayenne',
  'America/Paramaribo',
  'America/Suriname',
  'America/Argentina/Buenos_Aires',
  'America/Argentina/Catamarca',
  'America/Argentina/Cordoba',
  'America/Argentina/Jujuy',
  'America/Argentina/La_Rioja',
  'America/Argentina/Mendoza',
  'America/Argentina/Rio_Gallegos',
  'America/Argentina/Salta',
  'America/Argentina/San_Juan',
  'America/Argentina/San_Luis',
  'America/Argentina/Tucuman',
  'America/Argentina/Ushuaia',
  'America/Sao_Paulo',
  'America/Santiago',
  
  // Atlantic
  'Atlantic/Azores',
  'Atlantic/Bermuda',
  'Atlantic/Canary',
  'Atlantic/Cape_Verde',
  'Atlantic/Faroe',
  'Atlantic/Madeira',
  'Atlantic/Reykjavik',
  'Atlantic/South_Georgia',
  'Atlantic/Stanley',
  
  // Europe
  'Europe/Andorra',
  'Europe/Athens',
  'Europe/Belfast',
  'Europe/Belgrade',
  'Europe/Berlin',
  'Europe/Bratislava',
  'Europe/Brussels',
  'Europe/Bucharest',
  'Europe/Budapest',
  'Europe/Chisinau',
  'Europe/Copenhagen',
  'Europe/Dublin',
  'Europe/Gibraltar',
  'Europe/Guernsey',
  'Europe/Helsinki',
  'Europe/Isle_of_Man',
  'Europe/Istanbul',
  'Europe/Jersey',
  'Europe/Kaliningrad',
  'Europe/Kiev',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Luxembourg',
  'Europe/Madrid',
  'Europe/Malta',
  'Europe/Mariehamn',
  'Europe/Minsk',
  'Europe/Monaco',
  'Europe/Moscow',
  'Europe/Oslo',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Riga',
  'Europe/Rome',
  'Europe/Samara',
  'Europe/San_Marino',
  'Europe/Sarajevo',
  'Europe/Simferopol',
  'Europe/Skopje',
  'Europe/Sofia',
  'Europe/Stockholm',
  'Europe/Tallinn',
  'Europe/Tirane',
  'Europe/Uzhgorod',
  'Europe/Vaduz',
  'Europe/Vatican',
  'Europe/Vienna',
  'Europe/Vilnius',
  'Europe/Volgograd',
  'Europe/Warsaw',
  'Europe/Zagreb',
  'Europe/Zurich',
  
  // Africa
  'Africa/Abidjan',
  'Africa/Accra',
  'Africa/Addis_Ababa',
  'Africa/Algiers',
  'Africa/Asmara',
  'Africa/Bamako',
  'Africa/Bangui',
  'Africa/Banjul',
  'Africa/Bissau',
  'Africa/Blantyre',
  'Africa/Brazzaville',
  'Africa/Bujumbura',
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Ceuta',
  'Africa/Conakry',
  'Africa/Dakar',
  'Africa/Dar_es_Salaam',
  'Africa/Djibouti',
  'Africa/Douala',
  'Africa/El_Aaiun',
  'Africa/Freetown',
  'Africa/Gaborone',
  'Africa/Harare',
  'Africa/Johannesburg',
  'Africa/Juba',
  'Africa/Kampala',
  'Africa/Khartoum',
  'Africa/Kigali',
  'Africa/Kinshasa',
  'Africa/Lagos',
  'Africa/Libreville',
  'Africa/Lilongwe',
  'Africa/Lome',
  'Africa/Luanda',
  'Africa/Lubumbashi',
  'Africa/Lusaka',
  'Africa/Malabo',
  'Africa/Maputo',
  'Africa/Maseru',
  'Africa/Mauritius',
  'Africa/Mogadishu',
  'Africa/Monrovia',
  'Africa/Montserrado',
  'Africa/Nairobi',
  'Africa/Ndjamena',
  'Africa/Nicosia',
  'Africa/Nouakchott',
  'Africa/Ouagadougou',
  'Africa/Porto-Novo',
  'Africa/Sao_Tome',
  'Africa/Seychelles',
  'Africa/Taiohae',
  'Africa/Tripoli',
  'Africa/Tunis',
  'Africa/Windhoek',
  
  // Asia
  'Asia/Aden',
  'Asia/Almaty',
  'Asia/Amman',
  'Asia/Anadyr',
  'Asia/Aqtau',
  'Asia/Aqtobe',
  'Asia/Ashgabat',
  'Asia/Baghdad',
  'Asia/Bahrain',
  'Asia/Baku',
  'Asia/Bangkok',
  'Asia/Barnaul',
  'Asia/Beirut',
  'Asia/Bishkek',
  'Asia/Brunei',
  'Asia/Chita',
  'Asia/Choibalsan',
  'Asia/Chongqing',
  'Asia/Colombo',
  'Asia/Damascus',
  'Asia/Dhaka',
  'Asia/Dili',
  'Asia/Dubai',
  'Asia/Dushanbe',
  'Asia/Famagusta',
  'Asia/Gaza',
  'Asia/Hebron',
  'Asia/Ho_Chi_Minh',
  'Asia/Hong_Kong',
  'Asia/Hovd',
  'Asia/Irkutsk',
  'Asia/Jakarta',
  'Asia/Jayapura',
  'Asia/Jerusalem',
  'Asia/Kabul',
  'Asia/Kamchatka',
  'Asia/Karachi',
  'Asia/Kathmandu',
  'Asia/Khandyga',
  'Asia/Kolkata',
  'Asia/Krasnoyarsk',
  'Asia/Kuala_Lumpur',
  'Asia/Kuching',
  'Asia/Kuwait',
  'Asia/Macau',
  'Asia/Magadan',
  'Asia/Makassar',
  'Asia/Manila',
  'Asia/Muscat',
  'Asia/Nicosia',
  'Asia/Novosibirsk',
  'Asia/Omsk',
  'Asia/Oral',
  'Asia/Phnom_Penh',
  'Asia/Pontianak',
  'Asia/Pyongyang',
  'Asia/Qatar',
  'Asia/Qyzylorda',
  'Asia/Rangoon',
  'Asia/Riyadh',
  'Asia/Saigon',
  'Asia/Sakhalin',
  'Asia/Samarkand',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Srednekolymsk',
  'Asia/Taipei',
  'Asia/Tashkent',
  'Asia/Tbilisi',
  'Asia/Tehran',
  'Asia/Tel_Aviv',
  'Asia/Thimbu',
  'Asia/Tokyo',
  'Asia/Tomsk',
  'Asia/Ujung_Pandang',
  'Asia/Ulaanbaatar',
  'Asia/Urumqi',
  'Asia/Ust-Nera',
  'Asia/Vientiane',
  'Asia/Vladivostok',
  'Asia/Yakutsk',
  'Asia/Yekaterinburg',
  'Asia/Yerevan',
  
  // Indian Ocean
  'Indian/Antananarivo',
  'Indian/Chagos',
  'Indian/Christmas',
  'Indian/Cocos',
  'Indian/Comoro',
  'Indian/Kerguelen',
  'Indian/Mahe',
  'Indian/Maldives',
  'Indian/Mauritius',
  'Indian/Mayotte',
  'Indian/Reunion',
  
  // Pacific
  'Pacific/Apia',
  'Pacific/Auckland',
  'Pacific/Bougainville',
  'Pacific/Chatham',
  'Pacific/Chuuk',
  'Pacific/Easter',
  'Pacific/Efate',
  'Pacific/Enderbury',
  'Pacific/Fakaofo',
  'Pacific/Fiji',
  'Pacific/Funafuti',
  'Pacific/Galapagos',
  'Pacific/Gambier',
  'Pacific/Guadalcanal',
  'Pacific/Guam',
  'Pacific/Honolulu',
  'Pacific/Kiritimati',
  'Pacific/Kosrae',
  'Pacific/Kwajalein',
  'Pacific/Majuro',
  'Pacific/Marquesas',
  'Pacific/Midway',
  'Pacific/Nauru',
  'Pacific/Niue',
  'Pacific/Norfolk',
  'Pacific/Noumea',
  'Pacific/Pago_Pago',
  'Pacific/Palau',
  'Pacific/Pitcairn',
  'Pacific/Pohnpei',
  'Pacific/Port_Moresby',
  'Pacific/Rarotonga',
  'Pacific/Saipan',
  'Pacific/Samoa',
  'Pacific/Tahiti',
  'Pacific/Tarawa',
  'Pacific/Tongatapu',
  'Pacific/Truk',
  'Pacific/Wake',
  'Pacific/Wallis',
  'Pacific/Yap',
  
  // UTC
  'UTC',
  'Etc/UTC',
];

/**
 * Validates if a given timezone string is a valid IANA timezone
 * @param {string} timezone - The timezone string to validate
 * @returns {boolean} - True if valid IANA timezone, false otherwise
 */
export function isValidTimezone(timezone) {
  if (!timezone || typeof timezone !== 'string') {
    return false;
  }

  // Try to create a date formatter with this timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the user's browser timezone using the Intl API
 * @returns {string} - The user's timezone in IANA format
 */
export function detectUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Failed to detect timezone, defaulting to UTC:', error);
    return 'UTC';
  }
}

/**
 * Gets the list of IANA timezones
 * @returns {string[]} - Array of IANA timezone strings
 */
export function getTimezoneList() {
  return IANA_TIMEZONES;
}

/**
 * Formats timezone name for display (converts underscore to space)
 * @param {string} timezone - The timezone string
 * @returns {string} - Formatted timezone display name
 */
export function formatTimezoneForDisplay(timezone) {
  return timezone.replace(/_/g, ' ');
}

/**
 * Formats a UTC date/time to display in a specific salon's timezone
 * This ensures appointment times are displayed in the salon's local time,
 * not the user's browser time or raw UTC
 * 
 * @param {string|Date} utcDateString - The UTC date/time (e.g., from database)
 * @param {string} salonTimezone - The salon's IANA timezone (e.g., 'America/Los_Angeles')
 * @param {object} options - Optional formatting options
 * @returns {string} - Formatted date/time string in salon timezone
 * 
 * Example:
 *   formatSalonTime('2025-12-31T20:00:00.000Z', 'America/Los_Angeles')
 *   // Returns: "Dec 31, 2025, 12:00 PM" (not "8:00 PM")
 */
export function formatSalonTime(utcDateString, salonTimezone, options = {}) {
  if (!utcDateString) {
    return '';
  }

  // Default salonTimezone to UTC if not provided
  const timezone = salonTimezone || 'UTC';

  try {
    const date = new Date(utcDateString);
    
    // Default formatting options
    const defaultOptions = {
      timeZone: timezone, // CRITICAL: Force the salon's timezone
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    // Merge with any custom options
    const formatOptions = { ...defaultOptions, ...options };

    return new Intl.DateTimeFormat('en-US', formatOptions).format(date);
  } catch (error) {
    console.error('Error formatting salon time:', error);
    return utcDateString.toString();
  }
}

/**
 * Formats just the time portion (no date) in salon timezone
 * 
 * @param {string|Date} utcDateString - The UTC date/time
 * @param {string} salonTimezone - The salon's IANA timezone
 * @returns {string} - Formatted time string (e.g., "12:00 PM")
 */
export function formatSalonTimeOnly(utcDateString, salonTimezone) {
  return formatSalonTime(utcDateString, salonTimezone, {
    year: undefined,
    month: undefined,
    day: undefined,
  });
}

/**
 * Formats just the date portion (no time) in salon timezone
 * 
 * @param {string|Date} utcDateString - The UTC date/time
 * @param {string} salonTimezone - The salon's IANA timezone
 * @returns {string} - Formatted date string (e.g., "Dec 31, 2025")
 */
export function formatSalonDateOnly(utcDateString, salonTimezone) {
  return formatSalonTime(utcDateString, salonTimezone, {
    hour: undefined,
    minute: undefined,
    hour12: undefined,
  });
}

export default {
  IANA_TIMEZONES,
  isValidTimezone,
  detectUserTimezone,
  getTimezoneList,
  formatTimezoneForDisplay,
  formatSalonTime,
  formatSalonTimeOnly,
  formatSalonDateOnly,
};
