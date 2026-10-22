import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config";
import { AppError } from "./errors";

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function ensureUploadDir(): void {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

export function extensionForMime(mime: string): string | null {
  return MIME_EXTENSION[mime] ?? null;
}

export function contentTypeForFilename(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "application/octet-stream";
}

export function resolveReceiptPath(storedName: string): string {
  if (storedName !== path.basename(storedName)) {
    throw new AppError(400, "INVALID_RECEIPT", "Invalid receipt path");
  }
  const base = path.resolve(config.uploadDir);
  const resolved = path.resolve(base, storedName);
  const relative = path.relative(base, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new AppError(400, "INVALID_RECEIPT", "Invalid receipt path");
  }
  return resolved;
}

export function assertImageBytes(filePath: string): void {
  const handle = fs.openSync(filePath, "r");
  try {
    const header = Buffer.alloc(12);
    const bytesRead = fs.readSync(handle, header, 0, 12, 0);
    if (!looksLikeImage(header.subarray(0, bytesRead))) {
      throw new AppError(400, "INVALID_RECEIPT", "Receipt must be a JPEG, PNG, or WebP image");
    }
  } finally {
    fs.closeSync(handle);
  }
}

function looksLikeImage(header: Buffer): boolean {
  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return true;
  if (header.length >= 8 && header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return true;
  }
  return (
    header.length >= 12 &&
    header.subarray(0, 4).toString("ascii") === "RIFF" &&
    header.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

export function storedReceiptName(mime: string): string {
  const extension = extensionForMime(mime);
  if (!extension) {
    throw new AppError(400, "INVALID_RECEIPT", "Receipt must be a JPEG, PNG, or WebP image");
  }
  return `${crypto.randomUUID()}${extension}`;
}
