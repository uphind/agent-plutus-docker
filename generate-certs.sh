#!/bin/bash
set -e

# Generate a self-signed TLS certificate for Agent Plutus.
# Usage:
#   ./generate-certs.sh                    # uses DOMAIN from .env
#   ./generate-certs.sh 10.0.0.5           # for a specific IP
#   ./generate-certs.sh myhost.company.com  # for a specific domain

DOMAIN_ARG="$1"

if [ -z "$DOMAIN_ARG" ] && [ -f .env ]; then
  DOMAIN_ARG=$(grep -E '^DOMAIN=' .env | cut -d'"' -f2 | head -1)
fi

if [ -z "$DOMAIN_ARG" ]; then
  echo "Usage: $0 <domain-or-ip>"
  echo "   or: set DOMAIN in .env and run without arguments"
  exit 1
fi

mkdir -p certs

# Determine if it's an IP or a domain
if echo "$DOMAIN_ARG" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
  SAN="IP:${DOMAIN_ARG}"
  CN="$DOMAIN_ARG"
else
  SAN="DNS:${DOMAIN_ARG}"
  CN="$DOMAIN_ARG"
fi

openssl req -x509 -newkey rsa:4096 -sha256 -days 365 -nodes \
  -keyout certs/key.pem \
  -out certs/cert.pem \
  -subj "/CN=${CN}" \
  -addext "subjectAltName=${SAN}"

echo ""
echo "Self-signed certificate generated:"
echo "  certs/cert.pem  (certificate)"
echo "  certs/key.pem   (private key)"
echo "  Valid for: 365 days"
echo "  Subject:   ${CN}"
echo "  SAN:       ${SAN}"
echo ""
echo "Restart Docker to pick up the new certs:"
echo "  docker compose down && docker compose up -d"
