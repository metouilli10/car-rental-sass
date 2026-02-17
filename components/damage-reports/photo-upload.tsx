"use client";

import { useRef, useState } from "react";
import { Camera, X, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 5 }: PhotoUploadProps) {
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
    <div className="space-y-3">
      {/* Photo previews - horizontal scroll on mobile */}
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {photos.map((url, i) => (
            <div
              key={i}
              className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
            >
              <Image
                src={url}
                alt={`Photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {photos.length < maxPhotos && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 border-dashed gap-2"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Upload en cours...
              </>
            ) : photos.length === 0 ? (
              <>
                <Camera className="w-4 h-4" />
                Ajouter des photos
              </>
            ) : (
              <>
                <ImagePlus className="w-4 h-4" />
                Ajouter ({photos.length}/{maxPhotos})
              </>
            )}
          </Button>
        </>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
