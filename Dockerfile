FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache postgresql-client tzdata

# Definir timezone
ENV TZ=America/Sao_Paulo

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install --only=production

# Copiar código fonte
COPY . .

# Criar diretório para logs
RUN mkdir -p /app/logs && chmod 777 /app/logs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Comando para iniciar
CMD ["npm", "start"]
