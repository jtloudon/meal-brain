'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/auth/supabase-client';
import { Camera, X, Upload } from 'lucide-react';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageChange: (imageUrl: string | null) => void;
  householdId: string;
  recipeId?: string; // Optional for new recipes
}

export default function ImageUpload({
  currentImageUrl,
  onImageChange,
  householdId,
  recipeId,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('[ImageUpload] File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Validate file type - be lenient with image types
    // Some mobile cameras don't report standard MIME types
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      console.error('[ImageUpload] Invalid file type:', file.type);
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const supabase = createClient();
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${householdId}/${recipeId || 'temp'}-${Date.now()}.${fileExt}`;

      console.log('[ImageUpload] Uploading to:', fileName);

      const { data, error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('[ImageUpload] Upload error:', uploadError);
        throw uploadError;
      }

      console.log('[ImageUpload] Upload successful:', data);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('recipe-images').getPublicUrl(data.path);

      console.log('[ImageUpload] Public URL:', publicUrl);

      onImageChange(publicUrl);
    } catch (err) {
      console.error('[ImageUpload] Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Recipe Image</label>

      {preview ? (
        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={preview}
            alt="Recipe preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            aria-label="Remove image"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-100 transition-colors"
        >
          {uploading ? (
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 animate-pulse" />
              <p className="mt-2 text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="text-center">
              <Camera className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Click to upload image
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPEG, PNG, WebP, or HEIC (max 5MB)
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
