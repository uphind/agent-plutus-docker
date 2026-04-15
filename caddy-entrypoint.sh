#!/bin/sh
set -e

DOMAIN="${DOMAIN:-localhost}"
CADDYFILE="/etc/caddy/Caddyfile"

# Determine TLS mode
if [ -f /certs/cert.pem ] && [ -f /certs/key.pem ]; then
  TLS_LINE="tls /certs/cert.pem /certs/key.pem"
elif [ "$DOMAIN" = "localhost" ]; then
  TLS_LINE="tls internal"
elif echo "$DOMAIN" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
  TLS_LINE="tls internal"
else
  TLS_LINE=""
fi

# Write Caddyfile dynamically
cat > "$CADDYFILE" <<EOF
${DOMAIN} {
  reverse_proxy app:3000
  ${TLS_LINE}
}
EOF

echo "Caddy config: domain=${DOMAIN} tls=${TLS_LINE:-auto}"
exec caddy run --config "$CADDYFILE" --adapter caddyfile
