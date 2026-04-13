# TLS Certificates

Place your corporate TLS certificate files here:

- `cert.pem` — the certificate (or full chain)
- `key.pem` — the private key

The system auto-detects these files on startup:

| Files present?   | Behavior                                           |
|------------------|----------------------------------------------------|
| `cert.pem` + `key.pem` | Caddy uses your corporate certificates        |
| Neither          | Auto Let's Encrypt (public domain) or self-signed (localhost) |

## How to get these files

Ask your IT/security team for a TLS certificate for the domain you set in `DOMAIN`
(e.g. `ai-analytics.payoneer.com`). They will provide a `.pem` or `.crt` + `.key` pair.

If they give you `.crt` instead of `.pem`, just rename it — the format is the same.

If they provide a certificate chain (intermediate + root CA), concatenate them:

```bash
cat server.crt intermediate.crt root.crt > cert.pem
```

## Important

- Do NOT commit real certificates to git (they are gitignored)
- The private key (`key.pem`) must remain confidential
