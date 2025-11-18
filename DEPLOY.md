# 🚀 Guia Rápido de Deploy

## ⚡ Deploy em 5 Minutos

### 1️⃣ Railway (Recomendado)

```bash
# 1. Criar conta em railway.app
# 2. Instalar CLI
npm install -g @railway/cli

# 3. Login
railway login

# 4. Criar projeto
railway init

# 5. Adicionar variáveis
railway variables set TELEGRAM_BOT_TOKEN="8477021386:AAFlbh69qqzxIRZmfuMI3168TDWt9l2fpY0"
railway variables set PIX_API_KEY="apikey_bf4b4688300dd58afed9e11ffe28b40157d7c8bb1f9cda"
railway variables set PIX_API_TOKEN="apitoken_f6815555698bded8004cbdce0598651999af6f40c9eba8"
railway variables set SMS_ACTIVATE_API_KEY="0cd39b999d52580A9109b0ecf2f86938"
railway variables set APEX_API_KEY="cd30cc48f28bc5cbfcfe0e452139a20e"
railway variables set MIN_DEPOSIT="1.00"

# 6. Deploy
railway up

# 7. Obter URL
railway domain

# 8. Configurar webhook
railway variables set WEBHOOK_URL="https://sua-url.railway.app"

# 9. Configurar webhook do Telegram
npm run setup-webhook

# ✅ Pronto!
```

---

### 2️⃣ Render

1. Acesse [render.com](https://render.com/dashboard)
2. **New** → **Web Service**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name:** telegram-bot-pix
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Adicione as variáveis de ambiente:
   ```
   TELEGRAM_BOT_TOKEN=8477021386:AAFlbh69qqzxIRZmfuMI3168TDWt9l2fpY0
   PIX_API_KEY=apikey_bf4b4688300dd58afed9e11ffe28b40157d7c8bb1f9cda
   PIX_API_TOKEN=apitoken_f6815555698bded8004cbdce0598651999af6f40c9eba8
   SMS_ACTIVATE_API_KEY=0cd39b999d52580A9109b0ecf2f86938
   APEX_API_KEY=cd30cc48f28bc5cbfcfe0e452139a20e
   MIN_DEPOSIT=1.00
   PORT=3000
   ```
6. Copie a URL do seu app: `https://seu-app.onrender.com`
7. Adicione mais uma variável:
   ```
   WEBHOOK_URL=https://seu-app.onrender.com
   ```
8. Faça um novo deploy
9. Execute localmente: `npm run setup-webhook`

---

### 3️⃣ VPS (Ubuntu)

```bash
# 1. Conectar ao servidor
ssh root@seu-servidor

# 2. Atualizar sistema
apt update && apt upgrade -y

# 3. Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 4. Instalar build essentials (para SQLite)
apt install -y build-essential python3

# 5. Instalar PM2
npm install -g pm2

# 6. Criar diretório
mkdir -p /var/www/telegram-bot
cd /var/www/telegram-bot

# 7. Fazer upload dos arquivos ou clonar do Git
git clone seu-repositorio .

# 8. Instalar dependências
npm install

# 9. Configurar .env
nano .env
# Cole as variáveis e salve (Ctrl+X, Y, Enter)

# 10. Iniciar com PM2
pm2 start src/index.js --name telegram-bot

# 11. Configurar autostart
pm2 startup
pm2 save

# 12. Configurar webhook
npm run setup-webhook

# 13. Ver logs
pm2 logs telegram-bot

# 14. Comandos úteis
pm2 restart telegram-bot  # Reiniciar
pm2 stop telegram-bot     # Parar
pm2 status                # Status
```

---

### 4️⃣ Replit

1. Acesse [replit.com](https://replit.com)
2. **Create Repl** → **Import from GitHub**
3. Cole a URL do repositório
4. Clique no ícone de **🔒 Secrets**
5. Adicione todas as variáveis de ambiente
6. Configure `WEBHOOK_URL` como a URL do Replit
7. Clique em **Run** ▶️
8. Seu bot estará rodando!

**Importante:** No Replit, adicione este código no final do `index.js` para manter o bot sempre ativo:

```javascript
// Keep alive for Replit
setInterval(() => {
  console.log('Keep alive ping');
}, 5 * 60 * 1000); // 5 minutos
```

---

## 🔧 Configurar Webhook Manualmente

Se preferir configurar o webhook manualmente via cURL:

```bash
curl -X POST "https://api.telegram.org/bot8477021386:AAFlbh69qqzxIRZmfuMI3168TDWt9l2fpY0/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://sua-url.com/webhook/8477021386:AAFlbh69qqzxIRZmfuMI3168TDWt9l2fpY0"}'
```

Verificar webhook:

```bash
curl "https://api.telegram.org/bot8477021386:AAFlbh69qqzxIRZmfuMI3168TDWt9l2fpY0/getWebhookInfo"
```

---

## 🐛 Troubleshooting

### Bot não responde

1. Verifique se o webhook está configurado:
   ```bash
   curl "https://api.telegram.org/bot{TOKEN}/getWebhookInfo"
   ```

2. Verifique os logs:
   ```bash
   # PM2
   pm2 logs telegram-bot

   # Arquivo
   tail -f bot.log
   ```

3. Teste se o servidor está acessível:
   ```bash
   curl https://sua-url.com/health
   ```

### Erro "ECONNREFUSED"

- O servidor não está rodando
- Verifique: `pm2 status`
- Reinicie: `pm2 restart telegram-bot`

### Erro ao instalar dependências

SQLite precisa de ferramentas de build:

```bash
# Ubuntu/Debian
apt install -y build-essential python3

# CentOS/RHEL
yum groupinstall "Development Tools"
```

---

## 🎯 Checklist de Deploy

- [ ] Node.js 18+ instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado com todas as variáveis
- [ ] `WEBHOOK_URL` configurado corretamente (HTTPS)
- [ ] Servidor acessível publicamente
- [ ] Webhook do Telegram configurado
- [ ] Bot respondendo ao comando `/start`
- [ ] Logs sendo gerados corretamente

---

## 📊 Monitoramento

### Ver logs em tempo real

```bash
# PM2
pm2 logs telegram-bot --lines 100

# Arquivo
tail -f bot.log
```

### Verificar uso de recursos

```bash
pm2 monit
```

### Estatísticas

```bash
pm2 status
```

---

## 🔄 Atualizar o Bot

```bash
# 1. Fazer backup do banco de dados
cp bot.db bot.db.backup

# 2. Atualizar código
git pull origin main

# 3. Instalar novas dependências
npm install

# 4. Reiniciar bot
pm2 restart telegram-bot

# 5. Verificar logs
pm2 logs telegram-bot --lines 50
```

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs primeiro
2. Teste cada API individualmente
3. Verifique se todas as credenciais estão corretas
4. Certifique-se de que o webhook está configurado

---

**Bot pronto para processar milhares de transações! 🚀**
