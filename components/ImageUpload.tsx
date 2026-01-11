'use client';

import { useState, useRef, useEffect } from 'react';
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

  console.log('[ImageUpload] Render:', {
    hasCurrentImageUrl: !!currentImageUrl,
    currentImageUrl,
    hasPreview: !!preview,
    preview,
  });

  // Sync preview with currentImageUrl when it changes
  useEffect(() => {
    console.log('[ImageUpload] currentImageUrl changed:', currentImageUrl);
    setPreview(currentImageUrl || null);
  }, [currentImageUrl]);

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

      {/* Upload status indicator */}
      {uploading && (
        <div style={{
          padding: '12px',
          backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, white)',
          borderRadius: '8px',
          marginBottom: '12px',
          fontSize: '14px',
          fontWeight: '500',
          textAlign: 'center',
          color: 'color-mix(in srgb, var(--theme-primary) 80%, black)'
        }}>
          Uploading photo... Please wait before saving!
        </div>
      )}

      {preview ? (
        <div
          className="relative w-full bg-gray-100 rounded-lg overflow-hidden"
          style={{
            border: '3px solid red',
            height: '128px', // Force height with inline style
            minHeight: '128px',
            maxHeight: '128px'
          }}
        >
          <img
            src={preview}
            alt="Recipe preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove image"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '12px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              zIndex: 10,
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
            }}
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%',
            padding: '48px 20px',
            backgroundColor: '#f9fafb',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.borderColor = '#9ca3af';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
        >
          {uploading ? (
            <div style={{ textAlign: 'center' }}>
              <Upload style={{ margin: '0 auto', width: '32px', height: '32px', color: '#9ca3af' }} className="animate-pulse" />
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>Uploading...</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <Camera style={{ margin: '0 auto', width: '32px', height: '32px', color: '#9ca3af' }} />
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                Click to upload image
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
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
