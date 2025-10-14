# DDoS Attack Script - Jordan

## Description
Script de déni de service distribué pour saturer le système de vote et le rendre indisponible.

## Types d'attaques DDoS
1. **HTTP Flood** : Requêtes HTTP massives
2. **SYN Flood** : Saturation des connexions TCP
3. **Slowloris** : Maintien de connexions lentes
4. **UDP Flood** : Inondation de paquets UDP

## Utilisation
```bash
python3 ddos_attack.py http://voting-system:3000
```

## Outils suggérés
- **hping3** : Attaque au niveau TCP/IP
- **LOIC** (Low Orbit Ion Cannon)
- **Threading Python** : HTTP flood simple
- **Scapy** : Manipulation de paquets

## Impact attendu
- Ralentissement du serveur
- Timeouts sur les requêtes
- Indisponibilité du service
- Saturation CPU/RAM

## Contre-mesures
- Rate limiting (limite de requêtes par IP)
- Cloudflare / CDN
- Load balancing
- WAF (Web Application Firewall)
- Blacklisting d'IPs suspectes

## TODO pour Jordan
- [ ] Implémenter plusieurs types d'attaques DDoS
- [ ] Mesurer l'impact sur le serveur (temps de réponse)
- [ ] Tester avec hping3 si disponible
- [ ] Implémenter Slowloris
- [ ] Démontrer les contre-mesures (rate limiting)

## ⚠️ Avertissement
N'utilisez ce script QUE dans l'environnement Docker isolé du projet.
Toute utilisation malveillante est ILLÉGALE.
