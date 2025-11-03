# XSS Attack Script

## Description
Script d'attaque XSS (Cross-Site Scripting) utilisant **XSSer** pour détecter et exploiter automatiquement les vulnérabilités XSS sur DVWA.

## Outil utilisé
**XSSer** - Framework automatique de détection et d'exploitation de vulnérabilités XSS.

## Vulnérabilité ciblée
Page DVWA XSS (Reflected) : `/vulnerabilities/xss_r/`

Cette page affiche les entrées utilisateur sans échapper le HTML, permettant l'injection de code JavaScript malveillant.

## Utilisation
```bash
bash xss_attack.sh http://target:80
```

Le script est automatiquement lancé par le backend orchestrateur lors de la sélection de l'attaque XSS dans le dashboard.

## Payloads XSS typiques
- `<script>alert('XSS')</script>`
- `<img src=x onerror=alert('XSS')>`
- `<svg onload=alert('XSS')>`
- `<iframe src="javascript:alert('XSS')">`

## Exemple d'attaque réussie

![Exemple XSS DVWA](../../docs/xss-example.png)

Capture d'écran montrant une attaque XSS reflétée réussie sur DVWA :
- **Contexte** : Page "Reflected Cross Site Scripting (XSS)"
- **Résultat** : Affichage des informations sensibles (username: admin, security level: low, PHPIDs: disabled)
- **Impact** : Démonstration de l'exécution de code JavaScript malveillant dans le contexte de la page vulnérable

## Impact d'une XSS
- Vol de cookies de session
- Redirection vers des sites malveillants
- Défacement de la page
- Exécution de code JavaScript arbitraire dans le navigateur de la victime

## Contre-mesures
- Échapper toutes les entrées utilisateur (HTML encoding)
- Utiliser des bibliothèques de sanitization (DOMPurify)
- Implémenter une Content Security Policy (CSP)
- Valider les entrées côté serveur
- Utiliser des frameworks avec auto-escaping (React, Vue)

## Configuration actuelle
- Mode : Auto-scan
- Verbose : Activé

## ⚠️ Avertissement
N'utilisez ce script QUE dans l'environnement Docker isolé du projet.
Toute utilisation malveillante est ILLÉGALE.
