import { writeFileSync, appendFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Logger {
  constructor() {
    this.logFile = join(__dirname, '..', 'bot.log');
    if (!existsSync(this.logFile)) {
      writeFileSync(this.logFile, '');
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    appendFileSync(this.logFile, logLine);

    // Console também
    console.log(`[${timestamp}] [${level}] ${message}`, data || '');
  }

  info(message, data = null) {
    this.log('INFO', message, data);
  }

  error(message, data = null) {
    this.log('ERROR', message, data);
  }

  warn(message, data = null) {
    this.log('WARN', message, data);
  }

  success(message, data = null) {
    this.log('SUCCESS', message, data);
  }

  transaction(type, telegramId, amount, description) {
    this.log('TRANSACTION', `${type} - User ${telegramId}`, {
      type,
      telegramId,
      amount,
      description
    });
  }
}

export default new Logger();
