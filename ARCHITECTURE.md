# Architecture du Projet

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│                   Docker Network (attack-net)           │
│                                                         │
│  ┌──────────────┐      ┌──────────────┐      ┌────────┐ │
│  │   Frontend   │─────▶│   Backend    │─────▶│ Target │ │
│  │   (React)    │      │  (Express)   │      │ (Cible)│ │
│  │              │      │              │      │        │ │
│  │ Port: 8080   │      │ Port: 4000   │      │Port:3000 │
│  └──────────────┘      └──────┬───────┘      └───▲────┘ │
│                               │                   │     │
│                               ▼                   │     │
│                        ┌─────────────┐            │     │
│                        │   Attack    │────────────┘     │
│                        │   Scripts   │                  │
│                        │ (XSS/SQL    │                  │
│                        │   Injection/│                  │
│                        │    DoS)    │                  │
│                        └─────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

## Composants détaillés

### 1. Frontend (React) - Port 8080

**Rôle** : Interface de contrôle et visualisation des attaques

**Technologies** :
- React 18
- Chart.js pour les graphiques temps réel
- CSS custom (style sobre et professionnel)
- Nginx pour servir en production

**Composants principaux** :
- `App.js` : Interface complète avec sélection d'attaque
- `App.css` : Styles sans arrondis, couleurs neutres

**Fonctionnalités** :
- Sélection d'attaque : XSS, SQL Injection, DoS
- Paramètres configurables pour chaque attaque :
  - **XSS** : Mode (auto/manuel), Type de payload (basic/mixed/advanced)
  - **SQL** : Niveau (1-5), Technique SQLMap
  - **DoS** : Nombre de sockets, Sleeptime
- Boutons de contrôle : Lancer, Arrêter, Réinitialiser, Ouvrir cible
- LEDs de statut en temps réel (Backend, XSS, SQL, DoS)
- Terminal avec logs scrollables
- **Résultats extraits** :
  - XSS : Statistiques + capture d'écran
  - SQL : Dump de BDD avec users + hash MD5
  - DoS : Graphiques temps de réponse + req/sec
- Descriptions intégrées de chaque type d'attaque

### 2. Backend (Express) - Port 4000

**Rôle** : Orchestrateur qui lance et gère les scripts d'attaque

**Technologies** :
- Node.js + Express
- CORS activé
- Child processes pour lancer les scripts Python

**Routes API** :

```
GET  /health                           # Health check
GET  /api/attacks/status               # Statut de toutes les attaques

POST /api/attacks/xss/start            # Lancer XSS (avec params)
POST /api/attacks/xss/stop             # Arrêter XSS
GET  /api/attacks/xss/logs             # Logs XSS

POST /api/attacks/sql_injection/start  # Lancer SQL (avec params)
POST /api/attacks/sql_injection/stop   # Arrêter SQL
GET  /api/attacks/sql_injection/logs   # Logs SQL

POST /api/attacks/dos/start            # Lancer DoS (avec params)
POST /api/attacks/dos/stop             # Arrêter DoS
GET  /api/attacks/dos/logs             # Logs DoS
GET  /api/attacks/dos/metrics          # Métriques temps réel

POST /api/reset                        # Reset complet
```

**Gestion des processus** :
- Stocke les processus d'attaque en mémoire
- Capture stdout/stderr des scripts bash
- Permet l'arrêt gracieux des attaques
- **Collecte de métriques DoS** :
  - 10 requêtes/seconde vers la cible
  - Calcul temps de réponse moyen
  - Calcul requêtes par seconde réelles
  - Limite à 50 points de données
  - Intervalle de 1 seconde

### 3. Target (DVWA) - Port 3000

**Rôle** : Application web volontairement vulnérable (référence OWASP)

**Technologies** :
- DVWA (Damn Vulnerable Web Application)
- PHP + MySQL/MariaDB
- Apache Web Server

**Pages ciblées** :
- `/vulnerabilities/xss_r/` : XSS Reflected
- `/vulnerabilities/sqli/` : SQL Injection
- Serveur entier pour DoS

**Configuration requise** :
- Security Level : **Low**
- Créer/Reset la base de données au premier lancement
- Login : admin / password

**Vulnérabilités exploitées** :
- **XSS** : Pas d'échappement HTML dans les entrées utilisateur
- **SQL Injection** : Requêtes SQL non préparées, concaténation directe
- **DoS** : Pas de rate limiting, vulnérable à Slowloris

### 4. Attack Scripts

#### XSS
- **Dossier** : `attack-scripts/xss/`
- **Script** : `xss_attack.sh`
- **Outil** : XSSer (framework automatique)
- **Méthode** :
  1. Scan automatique avec XSSer
  2. Fallback avec payloads manuels via curl
  3. Tests : `<script>`, `<img onerror>`, `<svg onload>`
- **Sortie** : Logs + statistiques de vulnérabilités détectées

#### SQL Injection
- **Dossier** : `attack-scripts/sql_injection/`
- **Script** : `sql_attack.sh`
- **Outil** : SQLMap
- **Méthode** :
  1. Configuration niveau Low dans DVWA
  2. Test avec payload `1' OR '1'='1`
  3. Extraction BDD : version, nom, user
  4. Dump complet des tables users
- **Sortie** : Logs + données extraites (users + hash MD5)

#### DoS
- **Dossier** : `attack-scripts/dos/`
- **Script** : `dos_attack.sh`
- **Outil** : Slowloris (Python)
- **Méthode** :
  1. Ouverture de N sockets vers le serveur
  2. Envoi de requêtes HTTP partielles
  3. Maintien des connexions avec headers périodiques
  4. Saturation progressive du pool Apache
- **Paramètres** :
  - `--sockets` : 50-1000 (nombre de connexions)
  - `--sleeptime` : 1-30s (délai entre envois)
- **Impact** : Temps de réponse ↑, Débit ↓

## Flux de données

### Démarrage d'une attaque

```
1. User sélectionne une attaque (XSS/SQL Injection/DoS) dans le dashboard
   │
   ▼
2. User clique "LANCER L'ATTAQUE"
   │
   ▼
3. Frontend envoie POST à /api/attacks/{type}/start
   │
   ▼
4. Backend spawn le script Python correspondant
   │
   ▼
5. Script Python attaque la cible (localhost:3000)
   │
   ▼
6. Backend capture stdout/stderr → logs
   │
   ▼
7. Frontend polling /api/attacks/{type}/logs toutes les 2s
   │
   ▼
8. Logs affichés dans le terminal en temps réel
```

### Arrêt d'une attaque

```
1. User clique "ARRÊTER L'ATTAQUE"
   │
   ▼
2. Frontend envoie POST à /api/attacks/{type}/stop
   │
   ▼
3. Backend kill le processus Python
   │
   ▼
4. LED de statut s'éteint
```

## Docker Networking

Tous les services sont sur le même réseau Docker `attack-net` :

- Communication interne : hostnames (`target`, `backend`, `frontend`)
- Communication externe : localhost avec port mapping

**Exemple** :
- Backend → Target : `http://target:3000`
- User → Dashboard : `http://localhost:8080`
- User → Cible : `http://localhost:3000`

## Variables d'environnement

```bash
TARGET_URL=http://target:3000  # URL de la cible pour les scripts
```

## Sécurité de l'environnement

- **Isolation complète** : Tout tourne dans Docker
- **Pas d'impact externe** : Réseau isolé
- **Reset facile** : `docker-compose down -v`
- **Logs traçables** : Tout est loggé

## Structure des fichiers

```
projet-secumobile/
├── target/                    # Système cible
│   ├── public/
│   │   └── index.html        # Page simple "CIBLE"
│   ├── db/                   # Base de données SQLite
│   ├── server.js             # Serveur Express
│   ├── package.json
│   └── Dockerfile
│
├── backend/                   # Orchestrateur
│   ├── server.js             # API Express
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                  # Dashboard
│   ├── src/
│   │   ├── App.js            # Interface LOIC-style
│   │   ├── App.css           # Styles old school
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── Dockerfile
│
├── attack-scripts/            # Scripts d'attaque
│   ├── xss/                  # À remplir par Jordan
│   │   └── README.md
│   ├── sql_injection/                 # À remplir par Jordan
│   │   └── README.md
│   └── dos/                 # À remplir par Jordan
│       └── README.md
│
├── docker-compose.yml         # Configuration Docker
├── README.md                  # Documentation principale
├── ARCHITECTURE.md            # Ce fichier
└── .gitignore
```

## Performance

- Frontend : Build optimisé avec Nginx
- Backend : Single-threaded (suffisant pour la démo)
- Target : SQLite (léger, pas de setup)
- Scripts : Python standard library

## Évolutivité

Pour ajouter une nouvelle attaque :

1. Créer le script dans `attack-scripts/nouvelle-attaque/`
2. Ajouter les routes dans `backend/server.js`
3. Ajouter un radio button dans `frontend/src/App.js`
4. Rebuild : `docker-compose up --build`

## Limitations connues

- IP générée est cosmétique (attaque toujours localhost)
- Backend single-threaded : max 1 attaque de chaque type simultanée
- Logs stockés en mémoire : perdus au redémarrage
- Scripts Python : dépendent de l'environnement Docker
