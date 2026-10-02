/**
 * Client-side Agora RTC Token Generator
 * Provides 100% standard-compliant Agora Token 006 generation with SHA-256 HMAC and CRC-32.
 * Ensures voice channels connect seamlessly even without backend token service.
 */

const crcTable = (() => {
  let c;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32Str(str) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
  }
  return ((crc ^ (-1)) >>> 0);
}

function sha256(bytes) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const asciiBitLength = bytes.length * 8;
  const words = [];

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  for (let i = 0; i < bytes.length; i++) {
    words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8);
  }
  words[asciiBitLength >>> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >>> 9) << 4) + 15] = asciiBitLength;

  const w = new Array(64);
  for (let i = 0; i < words.length; i += 16) {
    let [a, b, c, d, e, f, g, h] = hash;

    for (let j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[j + i] | 0;
      } else {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    out[i * 4] = (hash[i] >>> 24) & 0xff;
    out[i * 4 + 1] = (hash[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (hash[i] >>> 8) & 0xff;
    out[i * 4 + 3] = hash[i] & 0xff;
  }
  return out;
}

function hmacSha256(keyStr, messageBytes) {
  let keyBytes = [];
  for (let i = 0; i < keyStr.length; i++) {
    keyBytes.push(keyStr.charCodeAt(i));
  }
  if (keyBytes.length > 64) {
    keyBytes = Array.from(sha256(keyBytes));
  }
  while (keyBytes.length < 64) {
    keyBytes.push(0);
  }

  const oKeyPad = new Uint8Array(64);
  const iKeyPad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    oKeyPad[i] = keyBytes[i] ^ 0x5c;
    iKeyPad[i] = keyBytes[i] ^ 0x36;
  }

  const inner = new Uint8Array(64 + messageBytes.length);
  inner.set(iKeyPad, 0);
  inner.set(messageBytes, 64);
  const innerHash = sha256(inner);

  const outer = new Uint8Array(64 + 32);
  outer.set(oKeyPad, 0);
  outer.set(innerHash, 64);
  return sha256(outer);
}

class ByteWriter {
  constructor() {
    this.bytes = [];
  }
  putUint16(v) {
    this.bytes.push(v & 0xff, (v >>> 8) & 0xff);
  }
  putUint32(v) {
    this.bytes.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
  }
  putBytes(arr) {
    this.putUint16(arr.length);
    for (let i = 0; i < arr.length; i++) this.bytes.push(arr[i]);
  }
  putTreeMapUInt32(map) {
    const keys = Object.keys(map);
    this.putUint16(keys.length);
    for (const k of keys) {
      this.putUint16(Number(k));
      this.putUint32(Number(map[k]));
    }
  }
  toArray() {
    return new Uint8Array(this.bytes);
  }
}

function base64Encode(bytes) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i;
  const l = bytes.length;
  for (i = 2; i < l; i += 3) {
    result += chars[bytes[i - 2] >> 2];
    result += chars[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += chars[((bytes[i - 1] & 0x0f) << 2) | (bytes[i] >> 6)];
    result += chars[bytes[i] & 0x3f];
  }
  if (i === l + 1) {
    result += chars[bytes[l - 2] >> 2];
    result += chars[((bytes[l - 2] & 0x03) << 4) | (bytes[l - 1] >> 4)];
    result += chars[(bytes[l - 1] & 0x0f) << 2];
    result += '=';
  } else if (i === l) {
    result += chars[bytes[l - 1] >> 2];
    result += chars[(bytes[l - 1] & 0x03) << 4];
    result += '==';
  }
  return result;
}

export const AGORA_APP_ID = 'd23c897f9305450faa7809ffcf666e57';
export const AGORA_APP_CERTIFICATE = '1b562d3ec8134249bda984e72d02213c';
export const AGORA_SECONDARY_CERTIFICATE = 'a293c89838a747b7a97f56768eeb7f0a';

export const generateAgoraRtcToken = ({
  appId = AGORA_APP_ID,
  appCertificate = AGORA_APP_CERTIFICATE,
  channelName,
  uid,
  expireSeconds = 86400,
}) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const actualTs = now + expireSeconds;
    const actualSalt = Math.floor(Math.random() * 0xffffffff) >>> 0;
    const uidStr = uid === 0 ? '' : String(uid || '');

    // 1. Message packing
    const msgWriter = new ByteWriter();
    msgWriter.putUint32(actualSalt);
    msgWriter.putUint32(actualTs);
    msgWriter.putTreeMapUInt32({
      1: actualTs, // kJoinChannel
      2: actualTs, // kPublishAudioStream
    });
    const mBytes = msgWriter.toArray();

    // 2. toSign bytes: appId + channelName + uid + m
    const toSignBytes = [];
    for (let i = 0; i < appId.length; i++) toSignBytes.push(appId.charCodeAt(i));
    for (let i = 0; i < channelName.length; i++) toSignBytes.push(channelName.charCodeAt(i));
    for (let i = 0; i < uidStr.length; i++) toSignBytes.push(uidStr.charCodeAt(i));
    for (let i = 0; i < mBytes.length; i++) toSignBytes.push(mBytes[i]);

    // 3. Signature
    const signatureBytes = hmacSha256(appCertificate, new Uint8Array(toSignBytes));

    // 4. CRCs
    const crcChannel = crc32Str(channelName);
    const crcUid = crc32Str(uidStr);

    // 5. Content packing
    const contentWriter = new ByteWriter();
    contentWriter.putBytes(signatureBytes);
    contentWriter.putUint32(crcChannel);
    contentWriter.putUint32(crcUid);
    contentWriter.putBytes(mBytes);
    const contentBytes = contentWriter.toArray();

    return '006' + appId + base64Encode(contentBytes);
  } catch (err) {
    console.warn('[AgoraToken] Generation error:', err);
    return '';
  }
};
