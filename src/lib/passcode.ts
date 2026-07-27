export const UNLOCK_KEY = 'film-log:unlocked';

export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function expectedHash(): string {
  return import.meta.env.VITE_PASSCODE_HASH ?? '';
}
