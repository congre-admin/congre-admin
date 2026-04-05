const FAVICON_SIZES = [16, 32, 48, 64, 180, 192, 512];
const ICO_SIZES = [16, 32, 48];

export interface GeneratedIcon {
  pngs: Record<string, string>;
  ico: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function resizeToDataUrl(img: HTMLImageElement, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}

function generateTextIconDataUrl(
  text: string,
  size: number,
  bgColor: string,
  textColor: string
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  const fontSize = text.length <= 1 ? size * 0.6 : size * 0.45;
  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), size / 2, size / 2 + size * 0.03);

  return canvas.toDataURL('image/png');
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function generateIcoBinary(png16: string, png32: string, png48: string): string {
  const pngData = [png16, png32, png48].map(dataUrlToBytes);
  const sizes = ICO_SIZES;

  const headerSize = 6;
  const entrySize = 16;
  const header = new Uint8Array(headerSize + entrySize * 3);

  header[0] = 0; header[1] = 0;
  header[2] = 1; header[3] = 0;
  header[4] = 3; header[5] = 0;

  let dataOffset = headerSize + entrySize * 3;

  for (let i = 0; i < 3; i++) {
    const offset = headerSize + entrySize * i;
    header[offset] = sizes[i] >= 256 ? 0 : sizes[i];
    header[offset + 1] = sizes[i] >= 256 ? 0 : sizes[i];
    header[offset + 2] = 0;
    header[offset + 3] = 0;
    header[offset + 4] = 1;
    header[offset + 5] = 0;
    header[offset + 6] = 32;
    header[offset + 7] = 0;
    const len = pngData[i].length;
    header[offset + 8] = len & 0xff;
    header[offset + 9] = (len >> 8) & 0xff;
    header[offset + 10] = (len >> 16) & 0xff;
    header[offset + 11] = (len >> 24) & 0xff;
    header[offset + 12] = dataOffset & 0xff;
    header[offset + 13] = (dataOffset >> 8) & 0xff;
    header[offset + 14] = (dataOffset >> 16) & 0xff;
    header[offset + 15] = (dataOffset >> 24) & 0xff;
    dataOffset += len;
  }

  const totalLength = dataOffset;
  const icoBytes = new Uint8Array(totalLength);
  icoBytes.set(header, 0);
  for (let i = 0; i < 3; i++) {
    icoBytes.set(pngData[i], headerSize + entrySize * 3 + pngData.slice(0, i).reduce((a, b) => a + b.length, 0));
  }

  let binary = '';
  for (let i = 0; i < icoBytes.length; i++) {
    binary += String.fromCharCode(icoBytes[i]);
  }

  return 'data:image/x-icon;base64,' + btoa(binary);
}

export function generateIconFromText(
  text: string,
  bgColor: string,
  textColor: string
): GeneratedIcon {
  const pngs: Record<string, string> = {};

  for (const size of FAVICON_SIZES) {
    pngs[size] = generateTextIconDataUrl(text, size, bgColor, textColor);
  }

  const ico = generateIcoBinary(pngs[16], pngs[32], pngs[48]);

  return { pngs, ico };
}

export async function generateIconFromImage(
  file: File
): Promise<GeneratedIcon> {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  URL.revokeObjectURL(url);

  const pngs: Record<string, string> = {};
  for (const size of FAVICON_SIZES) {
    pngs[size] = resizeToDataUrl(img, size, size);
  }

  const ico = generateIcoBinary(pngs[16], pngs[32], pngs[48]);

  return { pngs, ico };
}

export function generateTextIconPreview(
  text: string,
  bgColor: string,
  textColor: string,
  size: number = 64
): string {
  return generateTextIconDataUrl(text, size, bgColor, textColor);
}

export async function generateImagePreview(
  file: File,
  size: number = 64
): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  URL.revokeObjectURL(url);
  return resizeToDataUrl(img, size, size);
}
