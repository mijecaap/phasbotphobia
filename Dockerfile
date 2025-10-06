# Usar Node.js LTS
FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm i --only=production

# Copiar el código de la aplicación
COPY . .

# Exponer puerto (opcional, Discord bots no necesitan puerto pero Easypanel puede requerirlo)
EXPOSE 3000

# Variables de entorno (se configurarán desde Easypanel)
# DISCORD_TOKEN - Token del bot de Discord
# CLIENT_ID - ID de la aplicación de Discord
# N8N_WEBHOOK_URL - URL del webhook de n8n

# Comando para iniciar la aplicación
CMD ["npm", "start"]
