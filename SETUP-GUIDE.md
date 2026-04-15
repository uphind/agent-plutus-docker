# Agent Plutus — Setup Guide

This guide walks you through everything needed to get Agent Plutus running on your infrastructure, including cloud firewall configuration and SSO identity provider setup.

---

## 1. Cloud Firewall / Security Group

Agent Plutus needs ports **80** (HTTP) and **443** (HTTPS) open for inbound traffic. The steps depend on your cloud provider.

### AWS (EC2)

1. Open the [EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click **Instances** in the sidebar, then click your instance
3. Click the **Security** tab
4. Click the **Security Group** link (e.g. `sg-0abc1234`)
5. Click **Edit inbound rules**
6. Add two rules:

| Type | Protocol | Port range | Source | Description |
|------|----------|-----------|--------|-------------|
| HTTP | TCP | 80 | `0.0.0.0/0` | Agent Plutus HTTP |
| HTTPS | TCP | 443 | `0.0.0.0/0` | Agent Plutus HTTPS |

7. Click **Save rules**

Changes take effect immediately — no restart needed.

### Azure (VM)

1. Open the [Azure Portal](https://portal.azure.com)
2. Go to **Virtual machines** > click your VM
3. Click **Networking** > **Network settings** in the sidebar
4. Click **Add inbound port rule** (or **Create port rule** > **Inbound port rule**)
5. Add two rules:

| Setting | Rule 1 | Rule 2 |
|---------|--------|--------|
| Destination port ranges | `80` | `443` |
| Protocol | TCP | TCP |
| Action | Allow | Allow |
| Name | `AllowHTTP` | `AllowHTTPS` |

6. Click **Add** for each rule

### Google Cloud (Compute Engine)

1. Open the [GCP Console](https://console.cloud.google.com)
2. Go to **VPC network** > **Firewall**
3. Click **Create firewall rule**
4. Configure:

| Setting | Value |
|---------|-------|
| Name | `allow-http-https` |
| Direction | Ingress |
| Targets | All instances (or specific target tag) |
| Source IP ranges | `0.0.0.0/0` |
| Protocols and ports | TCP: `80,443` |

5. Click **Create**

### DigitalOcean (Droplet)

If you're using DigitalOcean's cloud firewall (not just the droplet):

1. Open the [DigitalOcean Console](https://cloud.digitalocean.com)
2. Go to **Networking** > **Firewalls**
3. Click your firewall (or create one and attach it to your droplet)
4. Under **Inbound Rules**, add:

| Type | Protocol | Port Range | Sources |
|------|----------|-----------|---------|
| HTTP | TCP | 80 | All IPv4, All IPv6 |
| HTTPS | TCP | 443 | All IPv4, All IPv6 |

5. Click **Save**

> **Note:** If your droplet has no cloud firewall attached, ports are open by default. You only need this step if you've created a DigitalOcean firewall.

---

## 2. SSO Identity Provider Setup

Agent Plutus authenticates users via your corporate identity provider using OIDC or SAML 2.0. SSO is only required when running in HTTPS mode (`PROTOCOL="https"`).

### Microsoft Entra ID (formerly Azure AD)

#### Step 1: Register the application

1. Open the [Azure Portal](https://portal.azure.com)
2. Go to **Microsoft Entra ID** > **App registrations**
3. Click **New registration**
4. Fill in the form:

| Field | Value |
|-------|-------|
| Name | `Agent Plutus` |
| Supported account types | Accounts in this organizational directory only |
| Redirect URI (Web) | `https://<your-domain>/api/auth/callback/oidc` |

5. Click **Register**

#### Step 2: Copy the application identifiers

On the app's **Overview** page, copy these two values:

| Field | Where to use it |
|-------|----------------|
| **Application (client) ID** | `.env` → `SSO_CLIENT_ID` |
| **Directory (tenant) ID** | `.env` → `SSO_ISSUER` (as part of the URL below) |

Your issuer URL is:

```
https://login.microsoftonline.com/<your-tenant-id>/v2.0
```

#### Step 3: Create a client secret

1. In the app registration, go to **Certificates & secrets**
2. Click **New client secret**
3. Enter a description (e.g. `Agent Plutus`) and pick an expiry
4. Click **Add**
5. Copy the **Value** column (not the Secret ID) — this is your `SSO_CLIENT_SECRET`

> **Important:** You can only see the secret value immediately after creation. If you navigate away, you'll need to create a new one.

#### Step 4: Verify API permissions

1. Go to **API permissions**
2. Verify these Microsoft Graph permissions are listed (they're added by default):
   - `openid`
   - `email`
   - `profile`
3. If they're missing, click **Add a permission** > **Microsoft Graph** > **Delegated permissions** and add them

#### Step 5: Update your `.env` file

```
SSO_PROVIDER="oidc"
SSO_ISSUER="https://login.microsoftonline.com/<your-tenant-id>/v2.0"
SSO_CLIENT_ID="<application-client-id>"
SSO_CLIENT_SECRET="<client-secret-value>"
SSO_ALLOWED_DOMAINS="your-domain.com"
```

Then restart:

```bash
sudo docker compose down && sudo docker compose up -d
```

---

### Okta

#### Step 1: Create an app integration

1. Open the **Okta Admin Console**
2. Go to **Applications** > **Applications**
3. Click **Create App Integration**
4. Select:
   - Sign-in method: **OIDC - OpenID Connect**
   - Application type: **Web Application**
5. Click **Next**

#### Step 2: Configure the app

| Field | Value |
|-------|-------|
| App integration name | `Agent Plutus` |
| Sign-in redirect URIs | `https://<your-domain>/api/auth/callback/oidc` |
| Sign-out redirect URIs | `https://<your-domain>` |
| Assignments | Select who should have access |

Click **Save**.

#### Step 3: Copy credentials

On the app's **General** tab, copy:

| Field | Where to use it |
|-------|----------------|
| **Client ID** | `.env` → `SSO_CLIENT_ID` |
| **Client secret** | `.env` → `SSO_CLIENT_SECRET` |

Your issuer URL is your Okta domain:

```
https://<your-okta-domain>.okta.com
```

#### Step 4: Update your `.env` file

```
SSO_PROVIDER="oidc"
SSO_ISSUER="https://<your-okta-domain>.okta.com"
SSO_CLIENT_ID="<client-id>"
SSO_CLIENT_SECRET="<client-secret>"
SSO_ALLOWED_DOMAINS="your-domain.com"
```

Then restart:

```bash
sudo docker compose down && sudo docker compose up -d
```

---

### Google Workspace

#### Step 1: Create OAuth credentials

1. Open the [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create one)
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the **OAuth consent screen** first:
   - User type: **Internal** (for Google Workspace orgs)
   - App name: `Agent Plutus`
   - Authorized domains: `<your-domain>`
   - Scopes: add `email`, `profile`, `openid`

#### Step 2: Configure the OAuth client

| Field | Value |
|-------|-------|
| Application type | Web application |
| Name | `Agent Plutus` |
| Authorized redirect URIs | `https://<your-domain>/api/auth/callback/oidc` |

Click **Create**.

#### Step 3: Copy credentials

| Field | Where to use it |
|-------|----------------|
| **Client ID** | `.env` → `SSO_CLIENT_ID` |
| **Client secret** | `.env` → `SSO_CLIENT_SECRET` |

The issuer URL for Google is always:

```
https://accounts.google.com
```

#### Step 4: Update your `.env` file

```
SSO_PROVIDER="oidc"
SSO_ISSUER="https://accounts.google.com"
SSO_CLIENT_ID="<client-id>.apps.googleusercontent.com"
SSO_CLIENT_SECRET="<client-secret>"
SSO_ALLOWED_DOMAINS="your-domain.com"
```

Then restart:

```bash
sudo docker compose down && sudo docker compose up -d
```

---

### SAML 2.0 (AD FS, Shibboleth, or any SAML IdP)

For SAML-based identity providers, you need three values from your IdP admin:

| Value | Where to find it | `.env` variable |
|-------|-------------------|-----------------|
| SSO URL / Entry Point | IdP metadata or admin console | `SSO_SAML_ENTRY_POINT` |
| Entity ID / Issuer | Usually your app's URL | `SSO_SAML_ISSUER` |
| Signing Certificate | IdP metadata (base64-encoded) | `SSO_SAML_CERT` |

Register this **ACS (Assertion Consumer Service) URL** in your IdP:

```
https://<your-domain>/api/auth/saml/acs
```

Update your `.env` file:

```
SSO_PROVIDER="saml"
SSO_SAML_ENTRY_POINT="https://your-idp.com/adfs/ls/"
SSO_SAML_ISSUER="https://<your-domain>"
SSO_SAML_CERT="<base64-encoded-signing-certificate>"
```

Then restart:

```bash
sudo docker compose down && sudo docker compose up -d
```

---

## 3. Domain Restriction (Optional)

You can restrict dashboard access to specific email domains. Only users whose email ends with one of the listed domains will be allowed in. Everyone else gets a 403 error.

Set `SSO_ALLOWED_DOMAINS` in your `.env` file:

```
SSO_ALLOWED_DOMAINS="company.com"
```

For multiple domains:

```
SSO_ALLOWED_DOMAINS="company.com,subsidiary.com"
```

Leave it empty to allow all authenticated users from your IdP:

```
SSO_ALLOWED_DOMAINS=""
```

---

## 4. Verify Everything Works

After completing the setup:

1. Open `https://<your-domain>` in your browser
2. Click **Log In** — you should be redirected to your IdP
3. Authenticate with your corporate credentials
4. You should land on the Agent Plutus dashboard

If you see an error:

| Error | Likely cause |
|-------|-------------|
| Page won't load | Firewall/security group not open on port 443 |
| "redirect_uri mismatch" | Redirect URI in your IdP doesn't exactly match `https://<your-domain>/api/auth/callback/oidc` |
| "DomainNotAllowed" | Your email domain isn't in `SSO_ALLOWED_DOMAINS` |
| "invalid_client" | `SSO_CLIENT_ID` or `SSO_CLIENT_SECRET` is wrong |
| Certificate warning | Expected with self-signed certs; use a real domain for auto Let's Encrypt |

To check app logs for more detail:

```bash
sudo docker compose logs app --tail 20
```
