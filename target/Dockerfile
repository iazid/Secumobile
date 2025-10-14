FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Créer le dossier de base de données
RUN mkdir -p /app/db

EXPOSE 3000

CMD ["npm", "start"]
