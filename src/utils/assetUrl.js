const ASSET_ORIGIN = 'https://api.yaroapp.in';

// Server paths must never be interpreted as files bundled in the APK.
export const resolveMediaUrl = value => {
  const raw = typeof value === 'object' ? value?.uri : value;
  if (typeof raw !== 'string') return '';
  const uri = raw.trim();
  if (!uri || /^(null|undefined|false)$/i.test(uri)) return '';
  if (/^(https?:\/\/|file:\/\/|content:\/\/|data:|asset:\/\/)/i.test(uri)) return uri;
  if (uri.startsWith('//')) return `https:${uri}`;
  return `${ASSET_ORIGIN}/${uri.replace(/^\/+/, '')}`;
};
