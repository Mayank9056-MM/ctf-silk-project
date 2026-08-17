const IMAGE_EXTENSIONS = [".webp", ".png", ".jpg", ".jpeg", ".gif", ".avif"];

/**
 * Primary check: file extension, as before. Fallback added for
 * Cloudinary specifically — a delivery URL under /image/upload/ is
 * always an image by construction, even in the edge case where a
 * transformation string or trailing slash means the literal URL text
 * doesn't end in a recognized extension. Never a blanket "any URL is
 * an image" assumption — still scoped to Cloudinary's own predictable
 * URL shape, not arbitrary hosts.
 */
export function isImageAttachment(url: string | null): url is string {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return true;
  return lower.includes("res.cloudinary.com") && lower.includes("/image/upload/");
}

export function exhibitLabel(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const letter = String.fromCharCode(65 + (Math.abs(hash) % 26));
  const num = (Math.abs(hash) % 99) + 1;
  return `${letter}-${String(num).padStart(2, "0")}`;
}