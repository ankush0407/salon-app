require('dotenv').config({ path: '.env.development' });
const db = require('./utils/db');

async function checkAppointmentTimezone() {
  try {
    console.log('\n🔍 Checking appointment timezone data\n');
    console.log('='.repeat(70));
    
    // Get the most recent appointment
    const result = await db.query(
      `SELECT 
        a.id,
        a.requested_time,
        a.proposed_time,
        a.status,
        c.name as customer_name,
        c.email,
        s.name as salon_name,
        s.timezone as salon_timezone
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      JOIN salons s ON a.salon_id = s.id
      WHERE c.email = 'inthebox.business@gmail.com'
      ORDER BY a.created_at DESC
      LIMIT 1`
    );
    
    if (result.rows.length === 0) {
      console.log('No appointments found for inthebox.business@gmail.com');
      process.exit(0);
    }
    
    const apt = result.rows[0];
    
    console.log('Latest Appointment:');
    console.log('  ID:', apt.id);
    console.log('  Customer:', apt.customer_name, `(${apt.email})`);
    console.log('  Salon:', apt.salon_name);
    console.log('  Salon Timezone:', apt.salon_timezone);
    console.log('  Status:', apt.status);
    console.log('\nRequested Time (UTC):', apt.requested_time);
    
    // Format in different timezones
    const utcTime = new Date(apt.requested_time);
    
    console.log('\nTime Conversions:');
    console.log('  UTC:', utcTime.toISOString());
    console.log('  Browser default:', utcTime.toLocaleString('en-US'));
    console.log('  In Salon TZ (' + apt.salon_timezone + '):', 
      utcTime.toLocaleString('en-US', { timeZone: apt.salon_timezone }));
    console.log('  In PST:', utcTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    console.log('  In EST:', utcTime.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Check completed!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkAppointmentTimezone();
