import crypto from "crypto";

export const PROVIDER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PROVIDER_IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const PROVIDER_IMAGE_OBJECT_PREFIX = "/objects/uploads/provider-images/";
const PROVIDER_IMAGE_STAGING_PREFIX = "/objects/uploads/provider-image-staging/";
const TOKEN_TTL_MS = 15 * 60 * 1000;

export class ProviderImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderImageValidationError";
  }
}

export function isProviderImageObjectPath(objectPath: string): boolean {
  return /^\/objects\/uploads\/provider-images\/[0-9a-f-]{36}$/i.test(objectPath)
    || /^\/objects\/uploads\/provider-image-staging\/[0-9a-f-]{36}$/i.test(objectPath);
}

export function assertProviderImageObjectPath(objectPath: unknown): asserts objectPath is string {
  if (typeof objectPath !== "string" || !isProviderImageObjectPath(objectPath)) {
    throw new ProviderImageValidationError("Invalid uploaded image reference");
  }
}

function getTokenSecret(): string {
  return process.env.SESSION_SECRET || "development-provider-image-upload-secret";
}

export function createProviderImageUploadToken(
  userId: string,
  objectPath: string,
  providerId: number,
): string {
  const payload = JSON.stringify({
    userId,
    objectPath,
    providerId,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getTokenSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyProviderImageUploadToken(
  token: unknown,
  userId: string,
  objectPath: string,
  providerId: number,
): boolean {
  if (typeof token !== "string") return false;
  const [encoded, signature, ...extra] = token.split(".");
  if (!encoded || !signature || extra.length > 0) return false;

  const expected = crypto
    .createHmac("sha256", getTokenSecret())
    .update(encoded)
    .digest("base64url");
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return (
      payload?.userId === userId &&
      payload?.objectPath === objectPath &&
      payload?.providerId === providerId &&
      typeof payload?.expiresAt === "number" &&
      payload.expiresAt >= Date.now()
    );
  } catch {
    return false;
  }
}

export function isStoredProviderImagePath(imageUrl: string): boolean {
  return imageUrl.startsWith(PROVIDER_IMAGE_OBJECT_PREFIX)
    && /^\/objects\/uploads\/provider-images\/[0-9a-f-]{36}$/i.test(imageUrl);
}

export function isStagedProviderImagePath(imageUrl: string): boolean {
  return imageUrl.startsWith(PROVIDER_IMAGE_STAGING_PREFIX)
    && /^\/objects\/uploads\/provider-image-staging\/[0-9a-f-]{36}$/i.test(imageUrl);
}

export function providerImageContentUrl(providerId: number, imageId: number): string {
  return `/api/providers/${providerId}/images/${imageId}/content`;
}