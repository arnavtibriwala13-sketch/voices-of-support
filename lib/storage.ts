import { supabase } from './supabase';

const BUCKET = 'media';

export async function uploadMedia(file: File, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, cacheControl: '3600' });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

  return publicUrl;
}

export async function uploadThumbnail(file: File, path: string): Promise<string> {
  return uploadMedia(file, path);
}
