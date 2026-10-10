import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

function createPng(width, height, isMaskable = false) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filter
  ihdr[12] = 0; // no interlace

  const stride = 1 + width * 4;
  const rawData = Buffer.alloc(height * stride);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * (isMaskable ? 0.48 : 0.44);
  const bellRadius = radius * 0.55;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride;
    rawData[rowOffset] = 0; // filter byte: none

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient or circle
      if (isMaskable) {
        // Deep indigo / slate full-bleed
        const t = (x + y) / (width + height);
        rawData[pxOffset] = Math.round(15 + t * 25);      // R: #0f172a to #222b45
        rawData[pxOffset + 1] = Math.round(23 + t * 45);  // G
        rawData[pxOffset + 2] = Math.round(42 + t * 80);  // B
        rawData[pxOffset + 3] = 255;
      } else {
        // Rounded squircle container
        if (dist <= radius) {
          const t = (x + y) / (width + height);
          rawData[pxOffset] = Math.round(15 + t * 20);
          rawData[pxOffset + 1] = Math.round(23 + t * 30);
          rawData[pxOffset + 2] = Math.round(42 + t * 50);
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = 0;
          rawData[pxOffset + 1] = 0;
          rawData[pxOffset + 2] = 0;
          rawData[pxOffset + 3] = 0;
        }
      }

      // Draw stylized reminder bell / clock in gold & blue
      // Ring center
      const inBellCircle = dist <= bellRadius && dist >= bellRadius * 0.72;
      // Clock hands
      const isCenterDot = dist <= bellRadius * 0.18;
      const isHourHand = (dx >= -1 && dx <= 2 && dy <= 0 && dy >= -bellRadius * 0.5);
      const isMinuteHand = (dy >= -1 && dy <= 2 && dx >= 0 && dx <= bellRadius * 0.65);

      if (inBellCircle || isCenterDot || isHourHand || isMinuteHand) {
        rawData[pxOffset] = 99;    // Emerald/indigo accent #6366f1
        rawData[pxOffset + 1] = 102;
        rawData[pxOffset + 2] = 241;
        rawData[pxOffset + 3] = 255;
      }

      // Small alert dot at top right
      const adx = x - (cx + bellRadius * 0.7);
      const ady = y - (cy - bellRadius * 0.7);
      if (Math.sqrt(adx * adx + ady * ady) <= bellRadius * 0.25) {
        rawData[pxOffset] = 244;   // Amber/coral alert #f59e0b
        rawData[pxOffset + 1] = 63;
        rawData[pxOffset + 2] = 94;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PNGs
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64, false));

// Generate icon.svg
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0f172a" />
      <stop offset="1" stop-color="#1e1b4b" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="160" y1="140" x2="352" y2="372" gradientUnits="userSpaceOnUse">
      <stop stop-color="#6366f1" />
      <stop offset="1" stop-color="#a855f7" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="330" y1="120" x2="400" y2="190" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f59e0b" />
      <stop offset="1" stop-color="#ef4444" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)"/>
  <circle cx="256" cy="260" r="130" stroke="url(#accentGrad)" stroke-width="20" stroke-linecap="round" stroke-dasharray="700 80"/>
  <circle cx="256" cy="260" r="14" fill="#6366f1"/>
  <path d="M256 185 V260 H315" stroke="#ffffff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Notification pulse badge -->
  <circle cx="360" cy="150" r="28" fill="url(#goldGrad)"/>
  <path d="M360 138 V152 M360 160 H360.02" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg);
console.log('Icons generated successfully!');
