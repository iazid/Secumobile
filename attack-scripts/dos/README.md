# DoS Attack Script

## Description
Script d'attaque par déni de service (DoS) utilisant **Slowloris** pour saturer le serveur DVWA et le rendre indisponible.

## Outil utilisé
**Slowloris** - Attaque DoS qui maintient des connexions HTTP lentes pour épuiser les ressources du serveur.

## Utilisation
```bash
bash dos_attack.sh http://target:80
```

Le script est automatiquement lancé par le backend orchestrateur lors de la sélection de l'attaque DoS dans le dashboard.

## Fonctionnement de Slowloris
1. Ouvre plusieurs connexions HTTP vers le serveur cible
2. Envoie des headers HTTP incomplets
3. Maintient les connexions ouvertes le plus longtemps possible
4. Empêche le serveur d'accepter de nouvelles connexions légitimes

## Impact attendu
- Ralentissement important du serveur DVWA
- Timeouts sur les requêtes HTTP
- Indisponibilité temporaire du service
- Saturation des connexions disponibles

## Contre-mesures
- Rate limiting (limite de connexions par IP)
- Timeout de connexion agressif
- Load balancing
- WAF (Web Application Firewall)
- Reverse proxy avec protection DoS (nginx, Cloudflare)
- Augmentation du nombre de connexions simultanées autorisées

## Configuration actuelle
- Port cible : 80
- Sleeptime : 15 secondes
- Mode verbose activé

## ⚠️ Avertissement
N'utilisez ce script QUE dans l'environnement Docker isolé du projet.
Toute utilisation malveillante est ILLÉGALE.
