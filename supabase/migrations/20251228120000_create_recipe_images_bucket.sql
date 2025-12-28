-- Create storage bucket for recipe images
-- Supports: JPEG, PNG, WebP, HEIC (iPhone default)

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true, -- Public bucket (images accessible via URL)
  5242880, -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
);

-- RLS Policy: Allow authenticated users to upload images for their household
CREATE POLICY "Users can upload recipe images for their household"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images' AND
  -- Extract household_id from path (format: {household_id}/{recipe_id}.{ext})
  (storage.foldername(name))[1]::uuid = (
    SELECT household_id FROM users WHERE id = auth.uid()
  )
);

-- RLS Policy: Allow authenticated users to update images for their household
CREATE POLICY "Users can update recipe images for their household"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-images' AND
  (storage.foldername(name))[1]::uuid = (
    SELECT household_id FROM users WHERE id = auth.uid()
  )
);

-- RLS Policy: Allow authenticated users to delete images for their household
CREATE POLICY "Users can delete recipe images for their household"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images' AND
  (storage.foldername(name))[1]::uuid = (
    SELECT household_id FROM users WHERE id = auth.uid()
  )
);

-- RLS Policy: Allow public read access (since bucket is public)
CREATE POLICY "Public can view recipe images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'recipe-images');
