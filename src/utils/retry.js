const logger = require('./logger');

async function retry(fn, maxAttempts = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        logger.error('Max retry attempts reached', {
          attempts: maxAttempts,
          error: error.message
        });
        throw error;
      }

      logger.warn('Retry attempt failed', {
        attempt: attempt,
        maxAttempts: maxAttempts,
        error: error.message
      });

      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}

module.exports = {
  retry
};
