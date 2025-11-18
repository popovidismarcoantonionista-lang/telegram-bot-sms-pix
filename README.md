# 🤖 Bot Telegram - PIX + SMS + Seguidores

Bot completo para Telegram com sistema de pagamentos PIX, SMS descartável e vendas de seguidores.

## 📋 Funcionalidades

✅ **Cadastro automático** de usuários pelo ID do Telegram  
✅ **Sistema de saldo interno** com SQLite  
✅ **Depósitos via PIX** com PixIntegra (QR Code + Copia e Cola)  
✅ **Verificação automática** de pagamentos via webhook  
✅ **SMS descartável** via SMS-Activate  
✅ **Venda de seguidores** via Apex Seguidores  
✅ **Histórico completo** de transações  
✅ **Logs detalhados** de todas as operações  

---

## 🏗️ Estrutura do Projeto

```
telegram-bot/
├── src/
│   ├── index.js       # Arquivo principal do bot
│   ├── pix.js         # Integração PixIntegra
│   ├── sms.js         # Integração SMS-Activate
│   ├── apex.js        # Integração Apex Seguidores
│   ├── database.js    # Gerenciamento SQLite
│   ├── menu.js        # Menus e mensagens
│   └── logger.js      # Sistema de logs
├── .env               # Variáveis de ambiente
├── package.json       # Dependências
├── bot.db             # Banco de dados (gerado automaticamente)
└── bot.log            # Arquivo de logs (gerado automaticamente)
```

---

## 🚀 Instalação Local

### 1. Clonar/Baixar o Projeto

```bash
cd telegram-bot
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `.env` e configure:

```env
TELEGRAM_BOT_TOKEN=8477021386:AAFlbh69qqzxIRZmfuMI3168TDWt9l2fpY0
WEBHOOK_URL=https://seu-dominio.com

PIX_API_KEY=apikey_bf4b4688300dd58afed9e11ffe28b40157d7c8bb1f9cda
PIX_API_TOKEN=apitoken_f6815555698bded8004cbdce0598651999af6f40c9eba8

SMS_ACTIVATE_API_KEY=0cd39b999d52580A9109b0ecf2f86938

APEX_API_KEY=cd30cc48f28bc5cbfcfe0e452139a20e

PORT=3000
MIN_DEPOSIT=1.00
```

### 4. Executar o Bot

**Modo desenvolvimento (polling):**
```bash
# Deixe WEBHOOK_URL vazio no .env
npm start
```

**Modo produção (webhook):**
```bash
# Configure WEBHOOK_URL no .env
npm start
```

---

## ☁️ Deploy 24/7

### 🔷 Opção 1: Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em **New Project** → **Deploy from GitHub repo**
3. Selecione o repositório do bot
4. Adicione as variáveis de ambiente em **Variables**
5. Configure `WEBHOOK_URL` como: `https://seu-projeto.railway.app`
6. Deploy automático! ✅

### 🔷 Opção 2: Render

1. Acesse [render.com](https://render.com)
2. **New** → **Web Service**
3. Conecte o repositório
4. Configurações:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Adicione as variáveis de ambiente
6. Configure `WEBHOOK_URL` como: `https://seu-app.onrender.com`
7. Deploy! ✅

### 🔷 Opção 3: Replit

1. Acesse [replit.com](https://replit.com)
2. Crie novo Repl → **Import from GitHub**
3. Cole o link do repositório
4. Configure as variáveis no **Secrets** (ícone de cadeado)
5. Configure `WEBHOOK_URL` como a URL do Replit
6. Clique em **Run** ✅

### 🔷 Opção 4: Cloudflare Workers

**Requer adaptação** - Workers não suporta SQLite nativamente. Alternativas:
- Usar Cloudflare D1 (banco de dados SQL)
- Usar KV Storage para dados simples
- Usar Durable Objects para estado

### 🔷 Opção 5: VPS (DigitalOcean, AWS, etc)

```bash
# 1. Conectar ao servidor
ssh usuario@seu-servidor

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar PM2
sudo npm install -g pm2

# 4. Clonar o projeto
git clone seu-repositorio
cd telegram-bot

# 5. Instalar dependências
npm install

# 6. Configurar .env
nano .env
# (configure as variáveis)

# 7. Iniciar com PM2
pm2 start src/index.js --name telegram-bot

# 8. Configurar para iniciar no boot
pm2 startup
pm2 save

# 9. Ver logs
pm2 logs telegram-bot
```

---

## 🔧 Comandos do Bot

| Comando | Descrição |
|---------|-----------|
| `/start` | Iniciar o bot e criar conta |
| `/saldo` | Ver saldo atual |
| `/depositar` | Fazer depósito via PIX |
| `/sms` | Comprar SMS descartável |
| `/seguidores` | Comprar seguidores |
| `/historico` | Ver histórico de transações |
| `/suporte` | Informações de suporte |

---

## 📱 Fluxo de Uso

### 💰 Depósito PIX

1. Usuário envia `/depositar`
2. Bot solicita o valor
3. Bot gera QR Code PIX + copia e cola
4. Usuário paga via app bancário
5. Bot verifica pagamento automaticamente
6. Saldo é creditado instantaneamente ✅

### 📱 SMS Descartável

1. Usuário envia `/sms`
2. Escolhe o serviço (WhatsApp, Telegram, etc)
3. Bot compra número e exibe
4. Usuário usa o número para cadastro
5. Bot monitora e entrega o código SMS ✅

### 👥 Seguidores

1. Usuário envia `/seguidores`
2. Escolhe a plataforma (Instagram, TikTok, etc)
3. Envia o link do perfil
4. Informa a quantidade
5. Bot processa o pedido ✅

---

## 🔐 Segurança

- ✅ Todas as credenciais em variáveis de ambiente
- ✅ Validação de saldo antes de compras
- ✅ Logs detalhados de todas as transações
- ✅ Tratamento de erros robusto

---

## 📊 Banco de Dados

O bot usa **SQLite** com as seguintes tabelas:

- `users` - Dados dos usuários
- `transactions` - Histórico de transações
- `pix_deposits` - Depósitos PIX
- `sms_orders` - Pedidos de SMS
- `apex_orders` - Pedidos de seguidores

---

## 🐛 Troubleshooting

### Bot não responde

```bash
# Ver logs
pm2 logs telegram-bot

# ou se estiver rodando direto
tail -f bot.log
```

### Erro ao conectar APIs

Verifique se as credenciais estão corretas no `.env`:
- `PIX_API_KEY` e `PIX_API_TOKEN`
- `SMS_ACTIVATE_API_KEY`
- `APEX_API_KEY`

### Webhook não funciona

1. Certifique-se de que `WEBHOOK_URL` está configurado corretamente
2. A URL deve ser HTTPS (não HTTP)
3. Verifique se o servidor está acessível publicamente
4. Teste manualmente: `curl https://seu-webhook.com/health`

---

## 📞 Suporte

Para dúvidas ou problemas:
- 📧 Email: suporte@seubot.com
- ✈️ Telegram: @seusuporte

---

## 📝 Licença

Este projeto é privado e proprietário.

---

## 🎯 Próximas Features

- [ ] Painel administrativo web
- [ ] Relatórios automáticos
- [ ] Sistema de cupons de desconto
- [ ] Programa de afiliados
- [ ] Suporte a mais métodos de pagamento

---

**Desenvolvido com ❤️ para automatizar vendas no Telegram**
