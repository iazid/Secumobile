FROM node:18-alpine

# Installer les outils nécessaires
RUN apk add --no-cache \
    bash \
    python3 \
    py3-pip \
    git 

# Installer SQLMap
RUN git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git /app/sqlmap \
 && ln -s /app/sqlmap/sqlmap.py /usr/local/bin/sqlmap \
 && chmod +x /app/sqlmap/sqlmap.py

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Créer le dossier logs
RUN mkdir -p /app/logs

EXPOSE 4000

CMD ["npm", "start"]
