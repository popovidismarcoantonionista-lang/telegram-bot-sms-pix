# 🚀 Guia de Deploy no Railway

## Pré-requisitos

- Conta no [Railway.app](https://railway.app)
- Conta no GitHub (já conectada)
- Repositório: `telegram-bot-sms-pix`

## Passo 1: Configurar PostgreSQL no Railway

1. Acesse [railway.app](https://railway.app) e faça login
2. Clique em **"New Project"**
3. Selecione **"Provision PostgreSQL"**
4. Railway criará automaticamente um banco PostgreSQL
5. Copie a `DATABASE_URL` que será gerada automaticamente

## Passo 2: Deploy da Aplicação

### Opção A: Deploy via GitHub (Recomendado)

1. No Railway, clique em **"New"** → **"GitHub Repo"**
2. Selecione o repositório: `telegram-bot-sms-pix`
3. Railway detectará automaticamente o Dockerfile e iniciará o build
4. Aguarde o deploy (2-5 minutos)

### Opção B: Deploy via CLI

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Linkar ao projeto
railway link

# Deploy
railway up
```

## Passo 3: Configurar Variáveis de Ambiente

No painel do Railway, vá em **"Variables"** e adicione:

### Obrigatórias:
```
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_WEBHOOK_URL=https://seu-app.up.railway.app/webhook/telegram
DATABASE_URL=postgresql://... (gerado automaticamente)
PORT=3000
NODE_ENV=production
```

### APIs:
```
PIXINTEGRA_API_TOKEN=seu_token
PIXINTEGRA_WEBHOOK_SECRET=seu_secret
PIXINTEGRA_BASE_URL=https://api.pixintegra.com

SMS_ACTIVATE_API_KEY=sua_key
SMS_ACTIVATE_BASE_URL=https://api.sms-activate.org

APEX_API_KEY=sua_key
APEX_BASE_URL=https://api.apexseguidores.com
APEX_AUTH_METHOD=Bearer
```

### Segurança:
```
JWT_SECRET=gere_um_token_seguro_aqui
HMAC_SECRET=gere_um_token_seguro_aqui
```

### Pricing (opcional):
```
MARGIN_ECONOMICO=1.7
MARGIN_PADRAO=2.2
MARGIN_PREMIUM=3.5
MINIMUM_PURCHASE=5.00
```

## Passo 4: Obter URL do Deploy

1. Após o deploy, Railway fornecerá uma URL tipo:
   `https://telegram-bot-sms-pix-production.up.railway.app`

2. Copie esta URL e atualize a variável:
   ```
   TELEGRAM_WEBHOOK_URL=https://sua-url.railway.app/webhook/telegram
   ```

3. Configure o webhook do Telegram:
   ```bash
   curl -X POST "https://api.telegram.org/bot<SEU_TOKEN>/setWebhook?url=https://sua-url.railway.app/webhook/telegram"
   ```

## Passo 5: Verificar Status

Acesse: `https://sua-url.railway.app/health`

Resposta esperada:
```json
{
  "status": "healthy",
  "uptime": 123.45
}
```

## Comandos Úteis Railway CLI

```bash
# Ver logs em tempo real
railway logs

# Ver status
railway status

# Abrir no navegador
railway open

# Redeploy
railway up --detach
```

## Troubleshooting

### Erro de conexão com banco
- Verifique se o PostgreSQL está rodando no Railway
- Confirme que a `DATABASE_URL` está correta

### Bot não responde
- Verifique se o webhook foi configurado corretamente
- Teste: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`

### Deploy falhou
- Verifique os logs: `railway logs`
- Confirme que todas as variáveis de ambiente estão configuradas

## Recursos Adicionais

- [Documentação Railway](https://docs.railway.app)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [PostgreSQL no Railway](https://docs.railway.app/databases/postgresql)

## Custos

- **Gratuito**: 500h de execução/mês ($5 em créditos)
- **Hobby Plan**: $5/mês (mais recursos)
- **Pro Plan**: $20/mês (ilimitado)

---

✅ **Deploy completo!** Seu bot está no ar 24/7 🎉
