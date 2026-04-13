import { SAML } from "@node-saml/node-saml";

export function getSamlClient(): SAML | null {
  const entryPoint = process.env.SSO_SAML_ENTRY_POINT;
  const issuer = process.env.SSO_SAML_ISSUER;
  const cert = process.env.SSO_SAML_CERT;

  if (!entryPoint || !issuer || !cert) return null;

  return new SAML({
    entryPoint,
    issuer,
    idpCert: cert,
    callbackUrl: `${process.env.AUTH_URL ?? "https://localhost"}/api/auth/saml/acs`,
    wantAssertionsSigned: false,
    wantAuthnResponseSigned: false,
  });
}
