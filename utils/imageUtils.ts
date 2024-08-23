const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function constructFullImageUrl(partialUrl: string): string {
  if (!partialUrl) return '';
  if (partialUrl.startsWith('http')) return partialUrl;
  return `${SUPABASE_URL}/storage/v1/object/public/${partialUrl}`;
}