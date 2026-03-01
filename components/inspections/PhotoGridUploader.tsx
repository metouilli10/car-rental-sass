"use client";

import { useRef, useState } from "react";
import { Camera, X, Loader2, Plus } from "lucide-react";
import Image from "next/image";

interface PhotoGridUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoGridUploader({
  photos,
  onPhotosChange,
  maxPhotos = 5,
}: PhotoGridUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const newPhotos: string[] = [];

      for (let i = 0; i < files.length; i++) {
        if (photos.length + newPhotos.length >= maxPhotos) break;

        const formData = new FormData();
        formData.append("photo", files[i]);

        const res = await fetch("/api/damage-reports/upload-photo", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erreur lors de l'upload");
        }

        const data = await res.json();
        newPhotos.push(data.photoUrl);
      }

      onPhotosChange([...photos, ...newPhotos]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {/* Existing photos */}
        {photos.map((url, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
          >
            <Image
              src={url}
              alt={`Photo ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Add photo tile */}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-primary hover:text-primary transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : photos.length === 0 ? (
              <>
                <Camera className="w-6 h-6" />
                <span className="text-xs font-medium">Ajouter</span>
              </>
            ) : (
              <>
                <Plus className="w-6 h-6" />
                <span className="text-xs font-medium">
                  {photos.length}/{maxPhotos}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
