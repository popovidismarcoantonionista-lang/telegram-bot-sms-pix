-- Schema para Bot Telegram SMS & Seguidores

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- 'deposit', 'purchase', 'refund'
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    payment_method VARCHAR(50), -- 'pix', 'balance'
    payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pedidos SMS
CREATE TABLE IF NOT EXISTS sms_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    transaction_id INTEGER REFERENCES transactions(id),
    activation_id VARCHAR(255), -- ID do SMS-Activate
    country VARCHAR(10),
    service VARCHAR(100),
    phone_number VARCHAR(50),
    sms_code VARCHAR(50),
    price DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pedidos de Seguidores
CREATE TABLE IF NOT EXISTS follower_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    transaction_id INTEGER REFERENCES transactions(id),
    order_id VARCHAR(255), -- ID do Apex Seguidores
    platform VARCHAR(50), -- 'instagram', 'tiktok', 'youtube'
    service_type VARCHAR(100), -- 'followers', 'likes', 'views'
    username VARCHAR(255),
    quantity INTEGER,
    price DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pagamentos PIX
CREATE TABLE IF NOT EXISTS pix_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    transaction_id INTEGER REFERENCES transactions(id),
    pix_key VARCHAR(255),
    qr_code TEXT,
    qr_code_image TEXT,
    amount DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'expired', 'cancelled'
    payment_id VARCHAR(255) UNIQUE,
    paid_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_sms_orders_user_id ON sms_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_orders_status ON sms_orders(status);
CREATE INDEX IF NOT EXISTS idx_follower_orders_user_id ON follower_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_follower_orders_status ON follower_orders(status);
CREATE INDEX IF NOT EXISTS idx_pix_payments_payment_id ON pix_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_status ON pix_payments(status);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_orders_updated_at BEFORE UPDATE ON sms_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follower_orders_updated_at BEFORE UPDATE ON follower_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
