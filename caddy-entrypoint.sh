#!/bin/sh
set -e

# If custom TLS certs are mounted, configure Caddy to use them
if [ -f /certs/cert.pem ] && [ -f /certs/key.pem ]; then
  export TLS_CONFIG="tls /certs/cert.pem /certs/key.pem"
elif [ "$DOMAIN" = "localhost" ] || [ -z "$DOMAIN" ]; then
  export TLS_CONFIG="tls internal"
elif echo "$DOMAIN" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
  # IP address — use Caddy's internal self-signed certificate
  export TLS_CONFIG="tls internal"
fi

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
