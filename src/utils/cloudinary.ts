// ─── Cloudinary Image Upload Utility ─────────────────────────────────────────
//
// Uses Cloudinary's unsigned upload API — no secret key required.
// All teammates get the same images after git pull because images live in the cloud.
//
// SETUP (one-time, shared with team):
//   1. Create a free account at https://cloudinary.com
//   2. Go to Settings → Upload → Add upload preset → set to "Unsigned"
//   3. Copy your Cloud Name and Preset Name into .env:
//        VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
//        VITE_CLOUDINARY_UPLOAD_PRESET=your_preset_name
//   4. Commit the .env.example (not .env) to git so teammates know what to set.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

export type UploadFolder = "profiles" | "vehicles" | "parts";

export interface CloudinaryUploadResult {
  url: string;       // https URL — safe to store in your DB or localStorage
  publicId: string;  // Cloudinary public_id for future transforms
}

/**
 * Uploads a File to Cloudinary via unsigned upload.
 * Returns the secure URL and public_id.
 */
export async function uploadImage(
  file: File,
  folder: UploadFolder
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and " +
      "VITE_CLOUDINARY_UPLOAD_PRESET to your .env file."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", `reviio/${folder}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    throw new Error("Image upload failed. Please try again.");
  }

  const data = await response.json();
  return { url: data.secure_url, publicId: data.public_id };
}

/**
 * Returns a Cloudinary transformation URL for a given public_id.
 * Use this for consistent resizing across the app.
 */
export function getImageUrl(
  publicIdOrUrl: string,
  opts: { width?: number; height?: number; crop?: string } = {}
): string {
  // If it's already a full URL (e.g. stored secure_url), return as-is
  if (publicIdOrUrl.startsWith("http")) return publicIdOrUrl;

  const { width = 400, height = 400, crop = "fill" } = opts;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_${crop},w_${width},h_${height}/${publicIdOrUrl}`;
}
