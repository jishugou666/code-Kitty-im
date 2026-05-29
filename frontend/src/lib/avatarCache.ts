const avatarCacheBuster = new Map<string, number>();

export function getAvatarUrl(url: string | null | undefined): string {
  if (!url) return '';

  try {
    if (url.startsWith('data:')) return url;

    const key = url.split('?')[0];
    const ts = Date.now();
    avatarCacheBuster.set(key, ts);

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${ts}`;
  } catch {
    return url;
  }
}

export function bustAvatarCache(url: string): string {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}`;
}
