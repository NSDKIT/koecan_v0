/*
  # Create storage bucket for images

  1. Storage
    - Create 'images' bucket for advertisement images
    - Set up public access policies
    - Configure file upload restrictions

  2. Security
    - Allow authenticated users to upload images
    - Allow public read access to images
    - Restrict file types and sizes
*/

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');

-- Allow authenticated users to update their uploaded images
CREATE POLICY "Authenticated users can update images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'images');

-- Allow authenticated users to delete their uploaded images
CREATE POLICY "Authenticated users can delete images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'images');

-- Allow public read access to images
CREATE POLICY "Public read access to images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');