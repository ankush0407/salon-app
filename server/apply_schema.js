const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

async function applySchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Ensure SSL is configured for Neon
    ...(process.env.DATABASE_URL.includes('neon') && { 
      ssl: { rejectUnauthorized: false } 
    })
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    console.log('Reading schema.sql...');
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    
    // Split by semicolons more carefully
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 80).replace(/\n/g, ' ');
      console.log(`[${i + 1}/${statements.length}] ${preview}...`);
      
      try {
        await client.query(statement);
        console.log(`✅ OK\n`);
      } catch (error) {
        // Expected errors for already-existing tables/constraints
        if (
          error.code === '42P07' || // duplicate table
          error.code === '42701' || // duplicate column
          error.code === '42P14' || // duplicate constraint
          error.message.includes('already exists')
        ) {
          console.log(`⚠️  Already exists (OK)\n`);
        } else {
          console.error(`❌ ERROR: ${error.message}\n`);
          throw error;
        }
      }
    }
    
    console.log('✅ Schema application complete!\n');
    
    // Verify tables exist
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;`
    );
    console.log('Tables in database:');
    tables.rows.forEach(row => console.log(`  ✓ ${row.table_name}`));
    
    client.release();
    pool.end();
    console.log('\n✅ All done!');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    pool.end();
    process.exit(1);
  }
}

applySchema();
