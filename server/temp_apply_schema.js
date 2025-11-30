const fs = require('fs');
const path = require('path');
const db = require('./utils/db'); // Assuming db.js is in utils folder

async function applySchema() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL into individual statements, ignoring comments and empty lines
    const statements = schemaSql.split(';').filter(s => s.trim() !== '' && !s.trim().startsWith('--'));

    for (const statement of statements) {
      if (statement.trim() !== '') {
        console.log('Executing:', statement.trim().substring(0, 70) + '...');
        await db.query(statement);
      }
    }

    console.log('Database schema applied successfully!');
  } catch (error) {
    console.error('Error applying database schema:', error);
    process.exit(1);
  } finally {
    // End the pool connection to allow the script to exit
    if (db.pool) {
      db.pool.end();
    }
  }
}

applySchema();
