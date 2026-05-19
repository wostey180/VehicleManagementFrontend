import { useRef, useState } from "react";
import { Upload, X, Loader } from "lucide-react";
import { uploadImage, type UploadFolder } from "../../utils/cloudinary";

interface ImageUploadProps {
  /** Current image URL to display (from DB / localStorage) */
  currentUrl?: string;
  /** Which Cloudinary folder to store in */
  folder: UploadFolder;
  /** Shape of the preview: "circle" for avatars, "square" for parts/vehicles */
  shape?: "circle" | "square";
  /** Size of the preview in px */
  size?: number;
  /** Called with the secure URL after a successful upload */
  onUploaded: (url: string) => void;
  /** Optional placeholder icon to show when no image */
  placeholder?: React.ReactNode;
}

export function ImageUpload({
  currentUrl,
  folder,
  shape = "square",
  size = 96,
  onUploaded,
  placeholder,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const displayUrl = preview || currentUrl;
  const isCircle = shape === "circle";

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    // Show local preview immediately for snappy UX
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setError("");
    setUploading(true);

    try {
      const result = await uploadImage(file, folder);
      setPreview(null); // let parent-provided URL take over
      onUploaded(result.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Preview / drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ width: size, height: size }}
        className={`relative cursor-pointer group overflow-hidden border-2 border-dashed border-[#3A3530] hover:border-[#C97B4A] transition-colors bg-[#1A1815] flex items-center justify-center ${
          isCircle ? "rounded-full" : "rounded-xl"
        }`}
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload size={18} className="text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-[#9A9490] group-hover:text-[#C97B4A] transition-colors">
            {placeholder ?? <Upload size={20} />}
            <span className="text-[10px] font-[Syne] text-center px-1">Upload</span>
          </div>
        )}

        {/* Uploading spinner overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader size={20} className="text-[#C97B4A] animate-spin" />
          </div>
        )}
      </div>

      {/* Clear button */}
      {displayUrl && !uploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPreview(null);
            onUploaded("");
          }}
          className="flex items-center gap-1 text-[10px] text-[#9A9490] hover:text-[#F09595] transition-colors font-[DM_Sans]"
        >
          <X size={10} /> Remove
        </button>
      )}

      {error && (
        <p className="text-[10px] text-[#F09595] font-[DM_Sans] text-center max-w-[120px]">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
