const db = require('./utils/db');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Check if salons table exists
    const result = await db.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salons');"
    );
    
    console.log('Salons table exists:', result.rows[0].exists);
    
    if (result.rows[0].exists) {
      // Try to insert a test salon
      const testResult = await db.query(
        'INSERT INTO salons (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING *',
        ['Test Salon', 'testdb@salon.com', '555-1234', '123 Test St']
      );
      console.log('Test insertion successful:', testResult.rows[0]);
    } else {
      console.log('ERROR: Salons table does not exist!');
      console.log('You need to run: psql -d salon_tracker -f schema.sql');
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  }
  process.exit(0);
}

testDatabase();
