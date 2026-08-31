#!/bin/bash
echo "Starting Phase 10K Security & PII Scan..."

# 1. Scan for potential secrets/keys in source code
echo "Checking for potential secrets/keys..."
grep -rE "sb_secret_|sk_|AI_|KEY|SECRET|PASSWORD" src/ | grep -v "process.env" | grep -v "publishable" | head -n 20

# 2. Check for eval/new Function
echo "Checking for eval/new Function usage..."
grep -r "eval(" src/
grep -r "new Function(" src/

# 3. Check for privileged endpoint auth
echo "Verifying API security middleware..."
grep -r "verifyApiSecret" src/routes/api/

echo "Scan complete."
