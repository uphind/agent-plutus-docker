import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { LoginClient } from "./login-client";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/dashboard";

  if (process.env.PROTOCOL === "http") {
    redirect(callbackUrl);
  }

  const session = await auth();

  if (session) {
    redirect(callbackUrl);
  }

  const ssoProvider = process.env.SSO_PROVIDER || "oidc";
  const error = params.error || null;

  async function signInWithOIDC() {
    "use server";
    await signIn("oidc", { redirectTo: callbackUrl });
  }

  return (
    <LoginClient
      ssoProvider={ssoProvider}
      callbackUrl={callbackUrl}
      error={error}
      signInAction={ssoProvider === "oidc" ? signInWithOIDC : undefined}
    />
  );
}
