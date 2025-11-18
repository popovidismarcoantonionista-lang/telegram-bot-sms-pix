import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DatabaseManager {
  constructor() {
    this.db = new Database(join(__dirname, '..', 'bot.db'));
    this.initTables();
  }

  initTables() {
    // Tabela de usuários
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        telegram_id INTEGER PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        balance REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de transações
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        reference TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
      )
    `);

    // Tabela de depósitos PIX
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pix_deposits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER,
        txid TEXT UNIQUE,
        amount REAL NOT NULL,
        qr_code TEXT,
        qr_code_image TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME,
        FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
      )
    `);

    // Tabela de pedidos SMS
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sms_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER,
        activation_id TEXT,
        phone_number TEXT,
        service TEXT,
        country TEXT,
        price REAL,
        status TEXT DEFAULT 'waiting',
        code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
      )
    `);

    // Tabela de pedidos Apex
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS apex_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER,
        order_id TEXT,
        service_id TEXT,
        link TEXT,
        quantity INTEGER,
        price REAL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
      )
    `);

    console.log('✓ Banco de dados inicializado');
  }

  // ===== USUÁRIOS =====
  getUser(telegramId) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE telegram_id = ?');
    return stmt.get(telegramId);
  }

  createUser(telegramId, username, firstName) {
    const stmt = this.db.prepare(`
      INSERT INTO users (telegram_id, username, first_name)
      VALUES (?, ?, ?)
      ON CONFLICT(telegram_id) DO UPDATE SET
        username = excluded.username,
        first_name = excluded.first_name,
        updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(telegramId, username, firstName);
  }

  getUserBalance(telegramId) {
    const user = this.getUser(telegramId);
    return user ? user.balance : 0;
  }

  updateBalance(telegramId, amount, operation = 'add') {
    const currentBalance = this.getUserBalance(telegramId);
    const newBalance = operation === 'add' 
      ? currentBalance + amount 
      : currentBalance - amount;

    const stmt = this.db.prepare(`
      UPDATE users 
      SET balance = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE telegram_id = ?
    `);
    return stmt.run(newBalance, telegramId);
  }

  // ===== TRANSAÇÕES =====
  createTransaction(telegramId, type, amount, description, status = 'completed', reference = null) {
    const stmt = this.db.prepare(`
      INSERT INTO transactions (telegram_id, type, amount, description, status, reference)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(telegramId, type, amount, description, status, reference);
  }

  getTransactions(telegramId, limit = 10) {
    const stmt = this.db.prepare(`
      SELECT * FROM transactions 
      WHERE telegram_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(telegramId, limit);
  }

  // ===== DEPÓSITOS PIX =====
  createPixDeposit(telegramId, txid, amount, qrCode, qrCodeImage) {
    const stmt = this.db.prepare(`
      INSERT INTO pix_deposits (telegram_id, txid, amount, qr_code, qr_code_image)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(telegramId, txid, amount, qrCode, qrCodeImage);
  }

  getPixDeposit(txid) {
    const stmt = this.db.prepare('SELECT * FROM pix_deposits WHERE txid = ?');
    return stmt.get(txid);
  }

  updatePixDepositStatus(txid, status, paidAt = null) {
    const stmt = this.db.prepare(`
      UPDATE pix_deposits 
      SET status = ?, paid_at = ? 
      WHERE txid = ?
    `);
    return stmt.run(status, paidAt, txid);
  }

  // ===== PEDIDOS SMS =====
  createSmsOrder(telegramId, activationId, phoneNumber, service, country, price) {
    const stmt = this.db.prepare(`
      INSERT INTO sms_orders (telegram_id, activation_id, phone_number, service, country, price)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(telegramId, activationId, phoneNumber, service, country, price);
  }

  getSmsOrder(activationId) {
    const stmt = this.db.prepare('SELECT * FROM sms_orders WHERE activation_id = ?');
    return stmt.get(activationId);
  }

  updateSmsOrder(activationId, status, code = null) {
    const stmt = this.db.prepare(`
      UPDATE sms_orders 
      SET status = ?, code = ? 
      WHERE activation_id = ?
    `);
    return stmt.run(status, code, activationId);
  }

  getUserSmsOrders(telegramId) {
    const stmt = this.db.prepare(`
      SELECT * FROM sms_orders 
      WHERE telegram_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    return stmt.all(telegramId);
  }

  // ===== PEDIDOS APEX =====
  createApexOrder(telegramId, orderId, serviceId, link, quantity, price) {
    const stmt = this.db.prepare(`
      INSERT INTO apex_orders (telegram_id, order_id, service_id, link, quantity, price)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(telegramId, orderId, serviceId, link, quantity, price);
  }

  getApexOrder(orderId) {
    const stmt = this.db.prepare('SELECT * FROM apex_orders WHERE order_id = ?');
    return stmt.get(orderId);
  }

  updateApexOrder(orderId, status) {
    const stmt = this.db.prepare(`
      UPDATE apex_orders 
      SET status = ? 
      WHERE order_id = ?
    `);
    return stmt.run(status, orderId);
  }

  getUserApexOrders(telegramId) {
    const stmt = this.db.prepare(`
      SELECT * FROM apex_orders 
      WHERE telegram_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    return stmt.all(telegramId);
  }

  close() {
    this.db.close();
  }
}

export default new DatabaseManager();
