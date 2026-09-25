/**
 * Pure JavaScript QR Code Generator for client-side SVG / Data URL generation.
 * Generates an SVG Data URL or SVG string for any URL/text without external dependencies.
 */

// QR Code Polynomial & Galois Field Table for Error Correction
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF256_EXP[i] = GF256_EXP[i - 255];
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function polyMul(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return result;
}

function getGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    poly = polyMul(poly, [1, GF256_EXP[i]]);
  }
  return poly;
}

function calcErrorCorrection(data: number[], ecCount: number): number[] {
  const gen = getGeneratorPoly(ecCount);
  const msg = [...data, ...new Array(ecCount).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

// Generate QR Code Matrix for Byte Mode (Version 3: 29x29, EC Level L - up to 32 bytes)
export function generateQRCodeSVG(text: string, size = 180): string {
  const bytes = new TextEncoder().encode(text);
  // We use Version 3 (29x29) for typical URLs up to ~32 chars
  const ver = 3;
  const modules = 17 + 4 * ver; // 29

  const matrix: (boolean | null)[][] = Array.from({ length: modules }, () => new Array(modules).fill(null));
  const reserved: boolean[][] = Array.from({ length: modules }, () => new Array(modules).fill(false));

  function setModule(r: number, c: number, val: boolean) {
    if (r >= 0 && r < modules && c >= 0 && c < modules) {
      matrix[r][c] = val;
      reserved[r][c] = true;
    }
  }

  // 1. Finder patterns (7x7)
  function drawFinder(r: number, c: number) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < modules && nc >= 0 && nc < modules) {
          if (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6) {
            const isBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
            const isCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
            setModule(nr, nc, isBorder || isCenter);
          } else {
            setModule(nr, nc, false);
          }
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, modules - 7);
  drawFinder(modules - 7, 0);

  // 2. Alignment pattern (5x5 at [20,20] for Ver 3)
  const alignPos = [6, 22];
  for (const ar of alignPos) {
    for (const ac of alignPos) {
      if (matrix[ar][ac] !== null) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
          const isCenter = dr === 0 && dc === 0;
          setModule(ar + dr, ac + dc, isBorder || isCenter);
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < modules - 8; i++) {
    if (matrix[6][i] === null) setModule(6, i, i % 2 === 0);
    if (matrix[i][6] === null) setModule(i, 6, i % 2 === 0);
  }

  // Dark module
  setModule(4 * ver + 9, 8, true);

  // Reserve format info area
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
    if (matrix[8][modules - 1 - i] === null) matrix[8][modules - 1 - i] = false;
    if (matrix[modules - 1 - i][8] === null) matrix[modules - 1 - i][8] = false;
  }

  // 4. Data Bitstream Encoding (Byte mode)
  const dataBits: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      dataBits.push((val >> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(bytes.length, 8); // Character count
  for (const b of bytes) {
    pushBits(b, 8);
  }

  // Total capacity for Ver 3-L = 55 codewords (440 bits)
  const maxBits = 440;
  pushBits(0, Math.min(4, maxBits - dataBits.length)); // Terminator
  while (dataBits.length % 8 !== 0) {
    dataBits.push(0);
  }

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (dataBits.length < maxBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to byte codewords
  const codewords: number[] = [];
  for (let i = 0; i < dataBits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | dataBits[i + j];
    }
    codewords.push(byte);
  }

  // Calculate 15 Error Correction codewords for Ver 3-L
  const ecCount = 15;
  const ecCodewords = calcErrorCorrection(codewords, ecCount);
  const finalCodewords = [...codewords, ...ecCodewords];

  // Convert final codewords to bit array
  const finalBits: number[] = [];
  for (const cw of finalCodewords) {
    for (let i = 7; i >= 0; i--) {
      finalBits.push((cw >> i) & 1);
    }
  }

  // 5. Place Data Bits in Matrix (zigzag from right to left)
  let bitIdx = 0;
  let dir = -1; // up
  let x = modules - 1;
  let y = modules - 1;

  while (x > 0) {
    if (x === 6) x--; // Skip vertical timing line
    for (let i = 0; i < 2; i++) {
      const col = x - i;
      const row = y;
      if (!reserved[row][col]) {
        const val = bitIdx < finalBits.length ? finalBits[bitIdx++] === 1 : false;
        matrix[row][col] = val;
      }
    }
    y += dir;
    if (y < 0 || y >= modules) {
      dir = -dir;
      y += dir;
      x -= 2;
    }
  }

  // 6. Format Information (Mask 0: (r+c)%2 === 0, EC L: 01)
  // Format string for EC L + Mask 0 = 0x77c4
  const formatVal = 0b111011111000100;
  const fmtBits: boolean[] = [];
  for (let i = 14; i >= 0; i--) {
    fmtBits.push(((formatVal >> i) & 1) === 1);
  }

  // Apply Mask 0 and Format Bits
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (!reserved[r][c] && matrix[r][c] !== null) {
        if ((r + c) % 2 === 0) {
          matrix[r][c] = !matrix[r][c];
        }
      }
    }
  }

  // Place format bits
  const fmtCoords1 = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  const fmtCoords2 = [
    [modules - 1, 8], [modules - 2, 8], [modules - 3, 8], [modules - 4, 8],
    [modules - 5, 8], [modules - 6, 8], [modules - 7, 8],
    [8, modules - 8], [8, modules - 7], [8, modules - 6], [8, modules - 5],
    [8, modules - 4], [8, modules - 3], [8, modules - 2], [8, modules - 1]
  ];

  for (let i = 0; i < 15; i++) {
    const b = fmtBits[i];
    const [r1, c1] = fmtCoords1[i];
    matrix[r1][c1] = b;
    const [r2, c2] = fmtCoords2[i];
    matrix[r2][c2] = b;
  }

  // 7. Render SVG Path
  const cellSize = 4;
  const padding = 2;
  const viewBoxSize = (modules + padding * 2) * cellSize;
  let pathD = '';

  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (matrix[r][c]) {
        const mx = (c + padding) * cellSize;
        const my = (r + padding) * cellSize;
        pathD += `M${mx},${my}h${cellSize}v${cellSize}h-${cellSize}z `;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${size}" height="${size}">
    <rect width="100%" height="100%" fill="#ffffff" />
    <path d="${pathD}" fill="#1e1b4b" />
  </svg>`;

  return svg;
}

export function generateQRCodeDataURL(text: string, size = 180): string {
  const svg = generateQRCodeSVG(text, size);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
