# Projet Simulateur de Cyberattaques

Interface graphique pour simuler 3 cyberattaques sur un système cible vulnérable : XSS, SQL Injection et DDoS.

## Architecture

```
target/             # Système cible vulnérable
backend/            # Backend orchestrateur Express
frontend/           # Interface LOIC-style (dashboard)
attack-scripts/     # Scripts d'attaque (XSS, SQL Injection, DDoS)
```

## Démarrage rapide

```bash
docker-compose up --build
```

**Interfaces disponibles :**
- Dashboard : http://localhost:8080
- Cible : http://localhost:3000
- Backend API : http://localhost:4000

## Composants

- **Target (Cible)** : Système web vulnérable (port 3000)
- **Backend Orchestrateur** : API Express pour lancer les attaques (port 4000)
- **Frontend Dashboard** : Interface LOIC-style de contrôle (port 8080)
- **Scripts d'attaque** : XSS + DDoS + SQL Injection(Jordan)

## Utilisation

1. Lancer l'environnement : `docker-compose up --build`
2. Ouvrir le dashboard : http://localhost:8080
3. Générer une IP cible (bouton "Nouvelle IP")
4. Sélectionner un type d'attaque (XSS / SQL Injection / DDoS)
5. Cliquer sur "LANCER L'ATTAQUE"
6. Observer les logs en temps réel

## Équipe

- **Yazid** : Infrastructure + Interface + Orchestration
- **Ulrich** : Script d'attaque XSS
- **Jordan** : Scripts d'attaque SQL Injection + SQL Injection + DDoS
- **Alexandre** : Présentation

## Technologies

- **Frontend** : React (interface style LOIC)
- **Backend** : Node.js + Express
- **Cible** : Node.js + Express + SQLite
- **Infrastructure** : Docker + Docker Compose
- **Scripts** : Python

## Avertissement

**Ce projet est à but éducatif uniquement.**
- Utilisez-le dans un environnement isolé (Docker)
- Ne jamais utiliser sur des systèmes réels sans autorisation
- Toute utilisation malveillante est illégale

## License

Projet éducatif - Utilisation responsable uniquement
