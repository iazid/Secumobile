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

**Rôle** : Interface de contrôle style LOIC

**Technologies** :
- React 18
- CSS custom (style LOIC old school)
- Nginx pour servir en production

**Composants principaux** :
- `App.js` : Interface complète avec génération d'IP
- Style inspiré de LOIC (Low Orbit Ion Cannon)

**Fonctionnalités** :
- Génération d'IP cible aléatoire (cosmétique)
- Radio buttons pour sélectionner l'attaque (XSS, SQL Injection, DoS)
- Boutons style Windows 95/XP
- LEDs de statut en temps réel
- Terminal avec logs
- Contrôles : threads, méthode, vitesse

### 2. Backend (Express) - Port 4000

**Rôle** : Orchestrateur qui lance et gère les scripts d'attaque

**Technologies** :
- Node.js + Express
- CORS activé
- Child processes pour lancer les scripts Python

**Routes API** :

```
GET  /health                    # Health check
GET  /api/attacks/status        # Statut de toutes les attaques

POST /api/attacks/xss/start     # Lancer XSS
POST /api/attacks/xss/stop      # Arrêter XSS
GET  /api/attacks/xss/logs      # Logs XSS

POST /api/attacks/sql_injection/start    # Lancer SQL Injection
POST /api/attacks/sql_injection/stop     # Arrêter SQL Injection
GET  /api/attacks/sql_injection/logs     # Logs SQL Injection

POST /api/attacks/dos/start    # Lancer DoS
POST /api/attacks/dos/stop     # Arrêter DoS
GET  /api/attacks/dos/logs     # Logs DoS

POST /api/reset                 # Reset complet
```

**Gestion des processus** :
- Stocke les processus d'attaque en mémoire
- Capture stdout/stderr des scripts Python
- Permet l'arrêt gracieux des attaques

### 3. Target (Cible) - Port 3000

**Rôle** : Système web volontairement vulnérable

**Technologies** :
- Node.js + Express
- SQLite pour la base de données
- HTML/CSS simple

**Page actuelle** :
- `/` : Page simple affichant "CIBLE"

**API disponibles** :
```
POST /api/posts             # Créer article (pour XSS futur)
GET  /api/posts             # Liste des articles
POST /api/comments          # Poster commentaire (VULNÉRABLE XSS)
GET  /api/comments/:id      # Obtenir commentaires
POST /api/reset             # Reset la DB
GET  /health                # Health check
```

**Vulnérabilités intentionnelles** :
- Pas de sanitisation HTML (XSS)
- Pas de rate limiting (DoS)
- Pas de CSRF protection
- Pas de Content Security Policy

### 4. Attack Scripts

#### XSS (Jordan)
- Dossier : `attack-scripts/xss/`
- Script à créer : `xss_attack.py`
- Cible : Injection de code malveillant
- README avec suggestions fourni

#### SQL Injection (Jordan)
- Dossier : `attack-scripts/sql_attack.sh/`
- Script à créer : `sql_attack.sh`
- Cible : 
- README avec suggestions fourni

#### DoS (Jordan)
- Dossier : `attack-scripts/dos/`
- Script à créer : `dos_attack.sh`
- Cible : Saturation du serveur
- README avec suggestions fourni

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
