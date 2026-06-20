import { put } from "@vercel/blob";
import { BLOB_READ_WRITE_TOKEN } from "./env";
import { HttpError } from "./http-error";

export function uploadsConfigured(): boolean {
  return Boolean(BLOB_READ_WRITE_TOKEN);
}

// Upload a buffer to Vercel Blob and return its public URL. Throws a localized
// 503 if the blob token is not configured (e.g. local dev).
export async function uploadImage(
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (!uploadsConfigured()) {
    throw new HttpError(503, "errors.upload.notConfigured", { code: "UPLOADS_NOT_CONFIGURED" });
  }
  const blob = await put(filename, buffer, {
    access: "public",
    token: BLOB_READ_WRITE_TOKEN,
    contentType,
    addRandomSuffix: true,
  });
  return blob.url;
}
