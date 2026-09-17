const BLOCKED_MEDIA_EXTENSIONS = /\.(?:pdf|png|jpe?g|webp|gif|svg|docx?|xlsx?|pptx?)(?:$|[?#])/i;

export const normalizeLanguages = (...values) => {
  for (const value of values) {
    const entries = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
    const normalized = entries
      .filter(item => typeof item === 'string' || typeof item === 'number')
      .map(item => String(item).trim())
      .filter(Boolean);
    if (normalized.length) return normalized;
  }
  return [];
};

export const isValidAudioPath = value =>
  typeof value === 'string' &&
  Boolean(value.trim()) &&
  !BLOCKED_MEDIA_EXTENSIONS.test(value.trim());

export const resolveAudioUrl = (value, apiBaseUrl) => {
  if (!isValidAudioPath(value)) return null;
  const clean = value.trim().replace(/\\/g, '/');
  if (/^https?:\/\//i.test(clean)) return clean;
  const origin = String(apiBaseUrl || '').replace(/\/api\/?$/i, '').replace(/\/+$/, '');
  return `${origin}${clean.startsWith('/') ? '' : '/'}${clean}`;
};