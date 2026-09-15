import "server-only";

// RFC 6750's bearer token grammar. Keeping this parser deliberately strict
// prevents accidentally accepting credentials from another auth scheme or
// from a header containing more than one value.
const BEARER_CREDENTIALS = /^Bearer[ \t]+([A-Za-z0-9\-._~+/]+=*)$/i;

export function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;

  const match = BEARER_CREDENTIALS.exec(authorization.trim());
  return match?.[1] ?? null;
}

export function unauthorizedBearerResponse(
  message = "需要 Authorization: Bearer <同步令牌>",
  invalidToken = false,
) {
  const responseHeaders = new Headers({
    "Cache-Control": "no-store",
    "WWW-Authenticate": invalidToken
      ? 'Bearer realm="StepStep API", error="invalid_token"'
      : 'Bearer realm="StepStep API"',
  });

  return Response.json(
    { success: false, message },
    { status: 401, headers: responseHeaders },
  );
}
