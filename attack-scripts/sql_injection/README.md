# SQL Injection Attack - Jordan

## Description
Script de détection et d’exploitation de vulnérabilités d’injection SQL à l’aide de l’outil **SQLMap**.  

## Vulnérabilité ciblée
Attente de la cible

## Utilisation
```bash
bash sql_attack.sh http://voting-system:3000/product?id=1
```

## Payloads testés
- `<script>alert('XSS')</script>`
- `<img src=x onerror=alert('XSS')>`
- `<svg onload=alert('XSS')>`

## Contre-mesures
- Utiliser des requêtes préparées (paramétrées) pour toutes les interactions SQL
- Masquer les messages d'erreur SQL dans les réponses HTTP
- Valider et filtrer toutes les entrées utilisateur côté serveur


