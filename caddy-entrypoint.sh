#!/bin/sh
set -e

DOMAIN="${DOMAIN:-localhost}"
PROTOCOL="${PROTOCOL:-https}"
CADDYFILE="/etc/caddy/Caddyfile"

if [ "$PROTOCOL" = "http" ]; then
  cat > "$CADDYFILE" <<EOF
http://${DOMAIN}:80 {
  reverse_proxy app:3000
}
EOF
  echo "Caddy config: http://${DOMAIN}:80 (no TLS)"
else
  if [ -f /certs/cert.pem ] && [ -f /certs/key.pem ]; then
    TLS_LINE="tls /certs/cert.pem /certs/key.pem"
  elif [ "$DOMAIN" = "localhost" ]; then
    TLS_LINE="tls internal"
  elif echo "$DOMAIN" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
    TLS_LINE="tls internal"
  else
    TLS_LINE=""
  fi

  cat > "$CADDYFILE" <<EOF
${DOMAIN}:443 {
  reverse_proxy app:3000
  ${TLS_LINE}
}
EOF
  echo "Caddy config: https://${DOMAIN}:443 tls=${TLS_LINE:-auto}"
fi

exec caddy run --config "$CADDYFILE" --adapter caddyfile
