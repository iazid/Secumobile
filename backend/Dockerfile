FROM node:18-slim

# Installer les outils nécessaires
RUN apt-get update && apt-get install -y \
    bash \
    python3 \
    python3-pip \
    python3-pycurl \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Installer les dépendances Python
RUN pip3 install --no-cache-dir --break-system-packages requests beautifulsoup4 lxml

# Installer SQLMap
RUN git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git /app/sqlmap \
 && ln -s /app/sqlmap/sqlmap.py /usr/local/bin/sqlmap \
 && chmod +x /app/sqlmap/sqlmap.py

# Créer un alias python -> python3
RUN ln -s /usr/bin/python3 /usr/bin/python

# Installer Xsser
RUN git clone --depth 1 https://github.com/epsylon/xsser.git /app/xsser \
 && ln -s /app/xsser/xsser /usr/local/bin/xsser \
 && chmod +x /app/xsser/xsser

# Installer Slowloris
RUN git clone --depth 1 https://github.com/gkbrk/slowloris.git /app/slowloris \
 && ln -s /app/slowloris/slowloris.py /usr/local/bin/slowloris \
 && chmod +x /app/slowloris/slowloris.py

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Créer le dossier logs
RUN mkdir -p /app/logs

EXPOSE 4000

CMD ["npm", "start"]
