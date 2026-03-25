import { supabase } from './supabase';

const BUCKET = 'media';

function sanitizeStoragePath(path: string): string {
  return path
    .split('/')
    .map((segment) => segment.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._\-]/g, '_'))
    .join('/');
}

export async function uploadMedia(file: File, path: string): Promise<string> {
  const safePath = sanitizeStoragePath(path);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(safePath, file, { upsert: true, cacheControl: '3600', contentType: file.type || 'application/octet-stream' });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(safePath);

  return publicUrl;
}

export async function uploadThumbnail(file: File, path: string): Promise<string> {
  return uploadMedia(file, path);
}
