# Man-in-the-Middle Attack Script - Jordan

## Description
Script d'interception de trafic réseau pour capturer et modifier les votes en transit.

## Vulnérabilité ciblée
Le système de vote utilise HTTP sans chiffrement, permettant l'interception et la modification des données.

## Utilisation
```bash
python3 mitm_attack.py http://voting-system:3000
```

## Outils suggérés
- **mitmproxy** : Proxy interactif pour HTTPS/HTTP
- **scapy** : Manipulation de paquets réseau
- **ARP spoofing** : Redirection du trafic

## Techniques
1. ARP Spoofing pour se positionner entre client et serveur
2. Interception des requêtes POST /api/vote
3. Modification des votes en transit
4. Capture des cookies de session

## Contre-mesures
- Utiliser HTTPS/TLS
- Implémenter HSTS (HTTP Strict Transport Security)
- Certificate Pinning
- Mutual TLS authentication

## TODO pour Jordan
- [ ] Implémenter ARP spoofing (attention : Docker networking)
- [ ] Capturer les votes avec mitmproxy
- [ ] Modifier les votes interceptés
- [ ] Logger toutes les données sensibles capturées
- [ ] Démontrer la capture de sessions
