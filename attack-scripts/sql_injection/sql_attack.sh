#!/bin/bash
# attack-scripts/sql_injection/sql_attack.sh

TARGET_URL="$1"

if [ -z "$TARGET_URL" ]; then
  echo "Usage: ./sql_attack.sh <target_url>"
  exit 1
fi

echo "[*] Running SQLMap against $TARGET_URL"
sqlmap -u "$TARGET_URL" --batch