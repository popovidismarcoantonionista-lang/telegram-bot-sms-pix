# Bot Telegram de Venda de Créditos SMS e Seguidores

Bot autônomo completo para venda de créditos SMS descartáveis (SMS-Activate) e seguidores (Apex Seguidores) com pagamento via PIX automático (PixIntegra).

## 🚀 Funcionalidades

- ✅ Venda de créditos com 3 pacotes: Econômico (×1.7), Padrão (×2.2), Premium (×3.5)
- ✅ Pagamento PIX automático via PixIntegra
- ✅ Webhook de confirmação com validação HMAC
- ✅ Compra de números SMS descartáveis via SMS-Activate
- ✅ Compra de seguidores via API Apex Seguidores
- ✅ Sistema de descontos progressivos
- ✅ Polling automático de códigos SMS
- ✅ Logs detalhados e idempotência
- ✅ Retry automático
- ✅ PostgreSQL ou MongoDB

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- PostgreSQL 14+ ou MongoDB 5+
- Telegram Bot Token
- Conta PixIntegra
- API Key SMS-Activate
- API Key Apex Seguidores

## 🔧 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/telegram-sms-bot.git
cd telegram-sms-bot

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Execute as migrations do banco
npm run migrate

# Inicie o servidor
npm start

# Desenvolvimento com hot reload
npm run dev
```

## 📦 Estrutura do Projeto

```
telegram-sms-bot/
├── src/
│   ├── index.js              # Entry point
│   ├── bot/
│   │   ├── handlers/         # Handlers dos comandos
│   │   ├── keyboards.js      # Teclados inline
│   │   └── messages.js       # Mensagens de texto
│   ├── api/
│   │   ├── pixintegra.js     # Cliente PixIntegra
│   │   ├── smsActivate.js    # Cliente SMS-Activate
│   │   └── apexSeguidores.js # Cliente Apex Seguidores
│   ├── database/
│   │   ├── models/           # Modelos do banco
│   │   └── migrations/       # Migrations
│   ├── webhooks/
│   │   ├── telegram.js       # Webhook Telegram
│   │   └── pixintegra.js     # Webhook PixIntegra
│   ├── services/
│   │   ├── pricing.js        # Cálculo de preços
│   │   ├── credits.js        # Gestão de créditos
│   │   └── polling.js        # Polling SMS
│   ├── middleware/
│   │   ├── auth.js           # Autenticação JWT
│   │   ├── hmac.js           # Validação HMAC
│   │   └── idempotency.js    # Idempotência
│   └── utils/
│       ├── logger.js         # Winston logger
│       ├── crypto.js         # Criptografia
│       └── retry.js          # Retry logic
├── .env.example
├── package.json
└── README.md
```

## 🎮 Comandos do Bot

- `/start` - Inicia o bot e registra o usuário
- `/comprar_creditos` - Compra de créditos (pacotes)
- `/comprar_sms` - Compra de número SMS descartável
- `/comprar_seguidores` - Compra de seguidores
- `/saldo` - Consulta saldo atual
- `/historico` - Histórico de transações
- `/ajuda` - Menu de ajuda

## 💰 Estratégia de Precificação

### Pacotes Disponíveis
- **Econômico**: Margem ×1.7
- **Padrão**: Margem ×2.2
- **Premium**: Margem ×3.5 + SLA 99% + Suporte prioritário

### Descontos Progressivos
- 5-20 números: 5% de desconto
- 21-100 números: 12% de desconto
- 100+: 20% de desconto

### Fórmula de Preço
```
Preço Final = (Custo Base + Taxa PixIntegra + Taxa API) × Margem × (1 - Desconto)
```

## 🔐 Segurança

- Tokens e chaves criptografadas via KMS
- Validação HMAC nos webhooks
- JWT para autenticação de endpoints
- Idempotência em pagamentos
- Rate limiting
- Logs de auditoria

## 🗄️ Esquema do Banco de Dados

### PostgreSQL

```sql
-- Usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tg_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    balance DECIMAL(10,2) DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'padrao',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pedidos
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    pixintegra_charge_id VARCHAR(255),
    tier VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aluguéis de SMS
CREATE TABLE sms_rents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    number_id VARCHAR(255),
    phone VARCHAR(50),
    service VARCHAR(100),
    status VARCHAR(50),
    sms_code VARCHAR(20),
    cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Pedidos de Seguidores
CREATE TABLE followers_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    platform VARCHAR(50),
    quantity INTEGER,
    target_url VARCHAR(500),
    price DECIMAL(10,2),
    status VARCHAR(50),
    apex_order_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100),
    level VARCHAR(20),
    message TEXT,
    payload JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transações de Idempotência
CREATE TABLE idempotency_keys (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);
```

## 🔌 Endpoints da API

### Webhooks
- `POST /webhook/telegram` - Webhook do Telegram
- `POST /webhook/pixintegra` - Confirmação de pagamento PixIntegra

### API REST (Protegida com JWT)
- `GET /api/v1/balance/:tg_id` - Consulta saldo
- `GET /api/v1/orders/:tg_id` - Lista pedidos
- `POST /api/v1/credits/add` - Adiciona créditos (admin)

## 📊 Monitoramento

Logs estruturados em JSON com Winston:
- `info` - Operações normais
- `warn` - Avisos (pagamento pendente)
- `error` - Erros críticos
- `debug` - Debug detalhado

## 🚀 Deploy

### Recomendado: Vercel, Railway ou Heroku

```bash
# Vercel
vercel --prod

# Railway
railway up

# Heroku
git push heroku main
```

### Configurar Webhook do Telegram

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://seu-dominio.com/webhook/telegram"}'
```

## 📝 Licença

MIT License

## 🤝 Suporte

Para suporte, entre em contato via Telegram: @seu_usuario
