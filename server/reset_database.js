const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

async function resetDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ...(process.env.DATABASE_URL.includes('neon') && { 
      ssl: { rejectUnauthorized: false } 
    })
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database\n');
    
    // Drop all tables in reverse dependency order
    console.log('Dropping existing tables...');
    const dropStatements = [
      'DROP TABLE IF EXISTS visits CASCADE;',
      'DROP TABLE IF EXISTS subscriptions CASCADE;',
      'DROP TABLE IF EXISTS subscription_types CASCADE;',
      'DROP TABLE IF EXISTS customers CASCADE;',
      'DROP TABLE IF EXISTS users CASCADE;',
      'DROP TABLE IF EXISTS salons CASCADE;'
    ];
    
    for (const stmt of dropStatements) {
      try {
        await client.query(stmt);
        console.log(`✅ ${stmt.split(' ')[3]}`);
      } catch (error) {
        console.log(`⚠️  ${stmt.split(' ')[3]}: ${error.message}`);
      }
    }
    
    console.log('\n✅ All tables dropped\n');
    
    // Now apply fresh schema
    console.log('Applying fresh schema...\n');
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements:\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 70).replace(/\n/g, ' ');
      
      try {
        await client.query(statement);
        console.log(`[${i + 1}/${statements.length}] ✅ ${preview}...`);
      } catch (error) {
        console.log(`[${i + 1}/${statements.length}] ❌ ${preview}...`);
        console.log(`  Error: ${error.message}`);
        throw error;
      }
    }
    
    console.log('\n✅ Schema applied successfully!\n');
    
    // Verify
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;`
    );
    console.log('✓ Tables created:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    client.release();
    pool.end();
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    pool.end();
    process.exit(1);
  }
}

resetDatabase();
