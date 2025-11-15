const { pool } = require('../database/connection');
const crypto = require('crypto');
const logger = require('../utils/logger');

async function checkIdempotency(req, res, next) {
  try {
    const key = req.headers['x-idempotency-key'] || 
                crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');

    req.idempotencyKey = key;

    const result = await pool.query(
      'SELECT response FROM idempotency_keys WHERE key = $1 AND expires_at > NOW()',
      [key]
    );

    if (result.rows.length > 0) {
      logger.info('Duplicate request detected', { key: key });
      return res.status(200).json(result.rows[0].response);
    }

    next();
  } catch (error) {
    logger.error('Error checking idempotency', { error: error.message });
    next();
  }
}

async function saveIdempotency(key, response) {
  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await pool.query(
      `INSERT INTO idempotency_keys (key, response, expires_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (key) DO UPDATE SET response = $2`,
      [key, JSON.stringify(response), expiresAt]
    );
  } catch (error) {
    logger.error('Error saving idempotency', { error: error.message });
  }
}

module.exports = {
  checkIdempotency,
  saveIdempotency
};
