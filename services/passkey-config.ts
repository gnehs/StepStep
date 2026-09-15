import "server-only";

export function getPasskeyConfig() {
  const configured = process.env.WEBAUTHN_ORIGIN;
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("WEBAUTHN_ORIGIN is required in production");
  }
  const url = new URL(configured || "http://localhost:3000");
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    (url.protocol !== "https:" &&
      !(url.protocol === "http:" && url.hostname === "localhost"))
  ) {
    throw new Error(
      "WEBAUTHN_ORIGIN must be an HTTPS origin (or HTTP localhost)",
    );
  }
  // Pin the RP to this exact hostname; never trust a request's Host/Origin headers.
  return {
    origin: url.origin,
    rpID: url.hostname,
    rpName: "餅餅踏踏",
    secure: url.protocol === "https:",
  };
}
