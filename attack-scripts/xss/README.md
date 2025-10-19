# XSS Attack Script - Jordan

## Description
**XSSer** est un outil qui permet de détecter et d'exploiter automatiquement des vulnérabilités XSS sur les applications web.

## Vulnérabilité ciblée
La page `/admin` affiche les commentaires sans échapper le HTML, permettant l'injection de code JavaScript malveillant.

## Utilisation
```bash
bash xss_attack.sh http://voting-system:3000/search?q=1
```

## Payloads testés
- `<script>alert('XSS')</script>`
- `<img src=x onerror=alert('XSS')>`
- `<svg onload=alert('XSS')>`

## Contre-mesures
- Utiliser DOMPurify pour nettoyer le HTML
- Implémenter une Content Security Policy (CSP)
- Échapper toutes les entrées utilisateur

