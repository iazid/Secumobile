FROM node:18-alpine

# Installer Python pour lancer les scripts d'attaque
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Créer le dossier logs
RUN mkdir -p /app/logs

EXPOSE 4000

CMD ["npm", "start"]
