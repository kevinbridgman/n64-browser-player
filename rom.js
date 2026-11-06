export function normalizeRom(buffer, expected = 'auto') {
  const bytes = new Uint8Array(buffer.slice(0));
  if (bytes.length < 4096 || bytes.length > 64 * 1024 * 1024 || bytes.length % 4) throw Error('Choose an uncompressed N64 ROM (up to 64 MB), not a ZIP.');
  const magic = new DataView(bytes.buffer).getUint32(0);
  if (magic === 0x37804012) {
    for (let i = 0; i < bytes.length; i += 2) [bytes[i], bytes[i+1]] = [bytes[i+1], bytes[i]];
  } else if (magic === 0x40123780) {
    for (let i = 0; i < bytes.length; i += 4) {
      [bytes[i], bytes[i+3]] = [bytes[i+3], bytes[i]];
      [bytes[i+1], bytes[i+2]] = [bytes[i+2], bytes[i+1]];
    }
  } else if (magic !== 0x80371240) throw Error('This file does not have a valid N64 ROM header.');
  const title = new TextDecoder().decode(bytes.subarray(0x20, 0x34)).replace(/\0/g, '').trim();
  const game = /SMASH BROTHERS/i.test(title) ? 'smash' : /^(THE LEGEND OF ZELDA|ZELDA.*TIME)$/i.test(title) ? 'zelda' : 'other';
  if (expected !== 'auto' && game !== expected) throw Error('The ROM header does not match the selected game. Choose Auto-detect for other regions or titles.');
  return {bytes, title: title || 'N64 game', game};
}
export async function romKey(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return 'n64-' + Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
}
