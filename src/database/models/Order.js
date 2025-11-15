const { pool } = require('../connection');

async function createOrder({ user_id, amount, status, tier }) {
  const result = await pool.query(
    `INSERT INTO orders (user_id, amount, status, tier) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [user_id, amount, status, tier]
  );
  return result.rows[0];
}

async function updateOrder(id, updates) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

  const result = await pool.query(
    `UPDATE orders SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0];
}

async function getOrderById(id) {
  const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  return result.rows[0];
}

async function getOrdersByUserId(userId) {
  const result = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

module.exports = {
  createOrder,
  updateOrder,
  getOrderById,
  getOrdersByUserId
};
