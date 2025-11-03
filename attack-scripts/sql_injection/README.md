# SQL Injection Attack Script

## Description
Script d'attaque par injection SQL utilisant **SQLMap** pour détecter et exploiter les vulnérabilités d'injection SQL sur DVWA.

## Outil utilisé
**SQLMap** - Outil automatique de détection et d'exploitation de vulnérabilités d'injection SQL.

## Vulnérabilité ciblée
Page DVWA SQL Injection : `/vulnerabilities/sqli/?id=1&Submit=Submit`

Cette page utilise des requêtes SQL non préparées, permettant l'injection de code SQL malveillant.

## Utilisation
```bash
bash sql_attack.sh http://target:80
```

Le script est automatiquement lancé par le backend orchestrateur lors de la sélection de l'attaque SQL Injection dans le dashboard.

## Payloads SQL Injection typiques
- `' OR '1'='1` - Bypass d'authentification
- `1' UNION SELECT NULL--` - Extraction de données
- `1'; DROP TABLE users--` - Suppression de tables (dangereux)
- `1' AND 1=2 UNION SELECT username, password FROM users--`

## Impact d'une SQL Injection
- Bypass d'authentification
- Extraction de données sensibles (users, passwords)
- Modification de données
- Suppression de tables
- Exécution de commandes système (dans certains cas)

## Contre-mesures
- Utiliser des **requêtes préparées** (prepared statements) avec paramètres bindés
- Validation stricte des entrées utilisateur
- Principe du moindre privilège pour les comptes DB
- Masquer les messages d'erreur SQL en production
- WAF (Web Application Firewall)
- ORM avec protection intégrée

## Configuration actuelle
- Mode : Batch (automatique, pas d'interaction)
- Objectif : Liste des bases de données (`--dbs`)
- Cookie : Authentification DVWA (sécurité Low)

## ⚠️ Avertissement
N'utilisez ce script QUE dans l'environnement Docker isolé du projet.
Toute utilisation malveillante est ILLÉGALE.
