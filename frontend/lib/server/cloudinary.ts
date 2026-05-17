import { createHash, randomUUID } from "crypto";

type CloudinaryUploadOptions = {
  folder: string;
  publicIdPrefix?: string;
  maxBytes?: number;
};

type CloudinaryUploadResult = {
  publicId: string;
  secureUrl: string;
};

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  return { cloudName, apiKey, apiSecret };
}

function signUpload(params: Record<string, string>, apiSecret: string) {
  const signatureBase = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(`${signatureBase}${apiSecret}`).digest("hex");
}

function cleanPublicIdPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function encodePublicId(publicId: string) {
  return publicId
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function cloudinaryImageUrl(publicId?: string | null) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !publicId) return "";

  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${encodePublicId(publicId)}`;
}

export async function uploadImageToCloudinary(
  file: Blob,
  options: CloudinaryUploadOptions,
): Promise<CloudinaryUploadResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }

  const maxBytes = options.maxBytes ?? 8 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Image must be under ${Math.floor(maxBytes / 1024 / 1024)}MB.`);
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const prefix = options.publicIdPrefix ? `${cleanPublicIdPart(options.publicIdPrefix)}-` : "";
  const publicId = `${prefix}${randomUUID()}`;
  const params = {
    folder: options.folder,
    public_id: publicId,
    timestamp,
  };
  const signature = signUpload(params, apiSecret);
  const form = new FormData();

  form.set("file", file);
  form.set("api_key", apiKey);
  form.set("timestamp", timestamp);
  form.set("folder", options.folder);
  form.set("public_id", publicId);
  form.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Cloudinary upload failed (${response.status}): ${message}`);
  }

  const data = (await response.json()) as { public_id?: string; secure_url?: string };
  if (!data.public_id || !data.secure_url) {
    throw new Error("Cloudinary upload did not return an image name.");
  }

  return {
    publicId: data.public_id,
    secureUrl: data.secure_url,
  };
}
