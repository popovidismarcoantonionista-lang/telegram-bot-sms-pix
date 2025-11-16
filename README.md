# Bot Telegram de Venda de Créditos SMS e Seguidores (v2.0)

[![CI/CD Status](https://github.com/popovidismarcoantonionista-lang/telegram-bot-sms-pix/workflows/ci.yml/badge.svg)](https://github.com/popovidismarcoantonionista-lang/telegram-bot-sms-pix/actions)
[![Node.js Version](https://img.shields.io/badge/node.js-%3E%3D18.0.0-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Bot autônomo completo para venda de créditos SMS descartáveis (SMS-Activate) e seguidores (Apex Seguidores) com pagamento via PIX automático (PixIntegra).

## 🚀 Funcionalidades

- ✅ **Venda de créditos** com 3 pacotes: Econômico (×1.7), Padrão (×2.2), Premium ×3.5)
- ✅ **Pagamento PIX automático** via PixIntegra
- ✅ **Webhook de confirmação** com validação HMAC
- ✅ **Compra de números SMS** descartáveis via SMS-Activate
- ✅ **Compra de seguidores** via API Apex Seguidores
- ✅ **Sistema de descontos** progressivos
- ✅ **Polling automático** de códigos SMS
- ✅ **Logs detalhados** e idempotência
- ✅ **Retry automático** em caso de falhas
- ✅ PostgreSQL **ou** MongoDB
- ✅ Arquitetura modular e escalável

## 🆕 Ovo na versão 2.0

- ✅ **Atualização de dependências** - Todas as pacotes atualizados
- ✅ **Winston Logger** - Logs estruturados em JSON
- ✅ **ESLint** - Análise de código automática
- ✅ **Prettier** - Formatação automática de código
- ✅ **Jest** - Testes unitários
- ✅ **Docker Compose** - Containerização completa
- ✅ **GitHub Actions** - CI/CD integrado
- ✅ **Node-cache** - Cache para melhor performance
- ✅ **Express-validator** - Validação de dados melhorada

## 📋 Pré-requisitos

- **Node.js** >= 18.0.0
- **PostgreSQL** 14+ ou **MongoDB** 5+
- **Telegram Bot Token**
- **PixIntegra Account**
- **API Key SMS-Activate**
- **API Key Apex Seguidores**

## 🔧 Instalação

### Instalação Manual

```bash
# Clone o repositório
git clone https://github.com/popovidismarcoantonionista-lang/telegram-bot-sms-pix.git
cd telegram-bot-sms-pix

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

### Instalação com Docker

```bash
# Clone o repositório
git clone https://github.com/popovidismarcoantonionista-lang/telegram-bot-sms-pix.git
cd telegram-bot-sms-pix

# Configure o .env
cp .env.example .env
# Edite o .env com suas credenciais

# Inicie todos os containers
docker-compose up -d

# Verifique os logs
docker-compose logs -f bot
```

## 📦 Estrutura do Projeto

```
telegram-bot-sms-pix/
├── src/
│   ├── api/             # Clientes API
│   ├── bot/              # Handlers do bot
│   ├── database/         # Models e migrations
│   ├── middleware/       # Middlewares
│   ├── services/        # Serviços de negócio
│   ├── utils/            # Utilitários
│   └── webhooks/        # Webhooks
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── jest.config.js
├── docker-compose.yml
├── Dockerfile
├── package.json
├── README.md
└── .github/workflows/ci.yml
```

## 🎯 Comandos do Bot

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

- ✅ Tokens e chaves criptografadas via KMS
- ✅ Validação HMAC nos webhooks
- ✅ JWT para autenticação de endpoints
- ✅ Idempotência em pagamentos
- ✅ Rate limiting
- ✅ Logs de auditoria
- ✅ Helmet para segurança HTTP

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar com coverage
npm test -- --coverage

# Executar testes em modo watch
npm test -- --watch
```

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

MIT License - Veja arquivo [LICENSE](LICENSE) para detalhes.

## 📈 Contribuição

Contribuições são bem-vindas! Abra uma **issue** ou **pull request**.

## 🤝 Suporte

Para suporte, entre em contato via Telegram.

---

Desenvolvido com ❤️ por `popovidismarcoantonionista-lang`