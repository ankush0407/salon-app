const db = require('./db');

// User operations
async function findUserByEmail(email) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
}

async function createUser(email, password, role) {
  const { rows } = await db.query(
    'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *',
    [email, password, role]
  );
  return rows[0];
}

module.exports = {
  findUserByEmail,
  createUser,
};
