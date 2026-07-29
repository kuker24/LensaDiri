import "server-only";

import * as oauth from "oauth4webapi";
import { importPKCS8, SignJWT } from "jose";

import type { OidcProvider, OidcTransaction } from "@/lib/auth/oidc";
import type { ServerEnvironment } from "@/lib/db/env-schema";

const issuers = {
  apple: new URL("https://appleid.apple.com"),
  google: new URL("https://accounts.google.com"),
} satisfies Record<OidcProvider, URL>;

type ProviderClient = {
  as: oauth.AuthorizationServer;
  auth: oauth.ClientAuth;
  client: oauth.Client;
  redirectUri: string;
};

async function createAppleClientSecret(environment: ServerEnvironment): Promise<string> {
  if (!environment.appleOidc) throw new Error("OIDC provider unavailable.");
  const now = Math.floor(Date.now() / 1_000);
  const key = await importPKCS8(environment.appleOidc.privateKey, "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: environment.appleOidc.keyId })
    .setIssuer(environment.appleOidc.teamId)
    .setSubject(environment.appleOidc.clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + 5 * 60)
    .sign(key);
}

async function getProviderClient(
  provider: OidcProvider,
  environment: ServerEnvironment,
): Promise<ProviderClient> {
  const clientId =
    provider === "google" ? environment.googleOidc?.clientId : environment.appleOidc?.clientId;
  if (!clientId) throw new Error("OIDC provider unavailable.");
  const issuer = issuers[provider];
  const discovery = await oauth.discoveryRequest(issuer);
  const as = await oauth.processDiscoveryResponse(issuer, discovery);
  const client: oauth.Client = {
    client_id: clientId,
    id_token_signed_response_alg: "RS256",
  };
  const secret =
    provider === "google"
      ? environment.googleOidc?.clientSecret
      : await createAppleClientSecret(environment);
  if (!secret) throw new Error("OIDC provider unavailable.");
  return {
    as,
    auth: oauth.ClientSecretPost(secret),
    client,
    redirectUri: `${environment.appOrigin}/api/auth/oidc/${provider}/callback`,
  };
}

export async function createOidcAuthorizationUrl(
  transaction: OidcTransaction,
  environment: ServerEnvironment,
): Promise<URL> {
  const { as, client, redirectUri } = await getProviderClient(transaction.provider, environment);
  if (!as.authorization_endpoint) throw new Error("OIDC provider metadata invalid.");
  const url = new URL(as.authorization_endpoint);
  url.searchParams.set("client_id", client.client_id);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", transaction.provider === "google" ? "openid email" : "name email");
  url.searchParams.set("state", transaction.state);
  url.searchParams.set("nonce", transaction.nonce);
  if (transaction.provider === "google") {
    url.searchParams.set(
      "code_challenge",
      await oauth.calculatePKCECodeChallenge(transaction.codeVerifier),
    );
    url.searchParams.set("code_challenge_method", "S256");
    if (transaction.operation === "delete") {
      url.searchParams.set("max_age", "0");
      url.searchParams.set("prompt", "login select_account");
    }
  } else {
    url.searchParams.set("response_mode", "form_post");
  }
  return url;
}

export async function exchangeOidcCode(input: {
  environment: ServerEnvironment;
  parameters: URLSearchParams;
  transaction: OidcTransaction;
}): Promise<{
  email: string | null;
  emailVerified: boolean;
  issuer: string;
  subject: string;
}> {
  const { as, auth, client, redirectUri } = await getProviderClient(
    input.transaction.provider,
    input.environment,
  );
  const parameters = oauth.validateAuthResponse(
    as,
    client,
    input.parameters,
    input.transaction.state,
  );
  const tokenResponse = await oauth.authorizationCodeGrantRequest(
    as,
    client,
    auth,
    parameters,
    redirectUri,
    input.transaction.provider === "google" ? input.transaction.codeVerifier : oauth.nopkce,
  );
  const tokens = await oauth.processAuthorizationCodeResponse(as, client, tokenResponse, {
    expectedNonce: input.transaction.nonce,
    ...(input.transaction.operation === "delete" ? { maxAge: 0 } : {}),
    requireIdToken: true,
  });
  await oauth.validateApplicationLevelSignature(as, tokenResponse);
  const claims = oauth.getValidatedIdTokenClaims(tokens);
  if (!claims?.sub || claims.iss !== issuers[input.transaction.provider].href.replace(/\/$/u, "")) {
    throw new Error("OIDC identity invalid.");
  }
  return {
    email: typeof claims.email === "string" ? claims.email : null,
    emailVerified: claims.email_verified === true,
    issuer: claims.iss,
    subject: claims.sub,
  };
}
