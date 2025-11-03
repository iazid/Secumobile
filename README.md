# Projet Simulateur de Cyberattaques

Interface graphique pour simuler 3 cyberattaques sur DVWA (Damn Vulnerable Web Application) : XSS, SQL Injection et DoS.

## Architecture

```
target/             # DVWA - Application vulnérable de référence
backend/            # Backend orchestrateur Express
frontend/           # Interface LOIC-style (dashboard)
attack-scripts/     # Scripts d'attaque (XSS, SQL Injection, DoS)
```

## Démarrage rapide

```bash
docker-compose up --build
```

**Interfaces disponibles :**
- Dashboard : http://localhost:8080
- DVWA (Cible) : http://localhost:3000
- Backend API : http://localhost:4000

**DVWA Login** (après premier démarrage) :
- Username: `admin`
- Password: `password`
- Cliquer sur "Create / Reset Database" lors de la première visite

## Composants

- **Target (DVWA)** : Application web volontairement vulnérable (port 3000)
- **Backend Orchestrateur** : API Express pour lancer les attaques (port 4000)
- **Frontend Dashboard** : Interface LOIC-style de contrôle (port 8080)
- **Scripts d'attaque** : XSS + SQL Injection + DoS (Jordan)

## Utilisation

1. Lancer l'environnement : `docker-compose up --build`
2. Configurer DVWA : http://localhost:3000 → "Create / Reset Database"
3. Se connecter : admin / password
4. **Mettre la sécurité en "Low"** dans DVWA Security
5. Ouvrir le dashboard : http://localhost:8080
6. Sélectionner un type d'attaque (XSS / SQL Injection / DoS)
7. Configurer les paramètres d'attaque (optionnel)
8. Cliquer sur "LANCER L'ATTAQUE"
9. Observer les logs et métriques en temps réel
10. Visualiser les résultats extraits (bases de données, vulnérabilités)

## Attaques disponibles

### 1. XSS (Cross-Site Scripting)
- **Cible** : DVWA → XSS (Reflected)
- **Outil** : XSSer (scan automatique + payloads manuels)
- **URL** : `/vulnerabilities/xss_r/`
- **Paramètres** :
  - Mode : Auto / Manuel
  - Type de payload : Basic / Mixed / Advanced
- **Résultats** : Nombre de payloads testés, taux de succès, capture d'écran d'exploitation

### 2. SQL Injection
- **Cible** : DVWA → SQL Injection
- **Outil** : SQLMap
- **URL** : `/vulnerabilities/sqli/`
- **Paramètres** :
  - Niveau d'attaque : 1-5 (intensité)
  - Technique : Boolean-based, Error-based, Union, Stacked, Time-based, Inline
- **Résultats** : Version BDD, nom, utilisateur, dump complet des users + hash MD5

### 3. DoS (Denial of Service)
- **Cible** : Serveur DVWA entier
- **Outil** : Slowloris
- **Paramètres** :
  - Nombre de sockets : 50-1000
  - Sleeptime : 1-30 secondes
- **Métriques temps réel** : Temps de réponse, Requêtes/seconde
- **Effet** : Saturation progressive du serveur web

## Équipe

- **Yazid** : Infrastructure + Interface + Orchestration
- **Ulrich** : Script d'attaque XSS
- **Jordan** : Scripts d'attaque SQL Injection + DoS
- **Alexandre** : Présentation

## Technologies

- **Frontend** : React + Chart.js (graphiques temps réel)
- **Backend** : Node.js + Express (orchestrateur + collecte métriques)
- **Cible** : DVWA (Damn Vulnerable Web Application)
- **Infrastructure** : Docker + Docker Compose
- **Outils d'attaque** : XSSer, SQLMap, Slowloris

## Fonctionnalités

- **Sélection d'attaque** avec paramètres configurables
- **Logs en temps réel** pour chaque attaque
- **Métriques DoS** : graphiques de temps de réponse et débit
- **Extraction de données** : dump automatique des bases SQL
- **Résultats XSS** : statistiques + capture d'écran d'exploitation
- **Interface sobre** : style professionnel sans fioritures
- **Boutons de contrôle** : lancer, arrêter, réinitialiser
- **Documentation intégrée** : explications de chaque type d'attaque

## Avertissement

**Ce projet est à but éducatif uniquement.**
- Utilisez-le dans un environnement isolé (Docker)
- Ne jamais utiliser sur des systèmes réels sans autorisation
- Toute utilisation malveillante est illégale
- DVWA est une application de test reconnue par OWASP

## Notes techniques

### Pourquoi DVWA ?
- Application de référence pour l'apprentissage de la sécurité
- Vulnérabilités documentées et intentionnelles
- Niveaux de sécurité ajustables (Low/Medium/High)
- Reconnue académiquement

### Restauration de la cible custom
Si vous souhaitez revenir à la cible custom originale :
```bash
cp docker-compose.yml.backup docker-compose.yml
docker-compose up --build
```

## License

Projet éducatif - Utilisation responsable uniquement
