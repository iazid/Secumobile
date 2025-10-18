FROM node:18-alpine

# Installer Python pour lancer les scripts d'attaque
RUN apk add --no-cache python3 py3-pip

# Installer Git pour cloner des dépôts
RUN apk add --no-cache git

# Cloner SQLMap pour les attaques SQLi
RUN git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git /app/sqlmap && \ ln -s /app/sqlmap/sqlmap.py /usr/local/bin/sqlmap

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Créer le dossier logs
RUN mkdir -p /app/logs

EXPOSE 4000

CMD ["npm", "start"]
