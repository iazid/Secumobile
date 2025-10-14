# XSS Attack Script - Ulrich

## Description
Script d'injection XSS pour exploiter la vulnérabilité sur la page admin du système de vote.

## Vulnérabilité ciblée
La page `/admin` affiche les commentaires sans échapper le HTML, permettant l'injection de code JavaScript malveillant.

## Utilisation
```bash
python3 xss_attack.py http://voting-system:3000
```

## Payloads testés
- `<script>alert('XSS')</script>`
- `<img src=x onerror=alert('XSS')>`
- `<svg onload=alert('XSS')>`

## Contre-mesures
- Utiliser DOMPurify pour nettoyer le HTML
- Implémenter une Content Security Policy (CSP)
- Échapper toutes les entrées utilisateur

## TODO pour Ulrich
- [ ] Ajouter plus de payloads sophistiqués
- [ ] Tester le vol de cookies
- [ ] Implémenter un keylogger XSS
- [ ] Démontrer le défacement de page
- [ ] Ajouter les contre-mesures avec DOMPurify
