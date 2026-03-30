import path from "path";

/**
 * Returns a safe file extension for temp storage (alphanumeric ext only).
 */
export function safeExtensionFromFilename(filename: string): string {
  const ext = path.extname(filename || "").toLowerCase();
  if (ext && /^\.[a-z0-9]{1,10}$/.test(ext)) {
    return ext;
  }
  return ".bin";
}
