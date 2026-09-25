import { generateQRCodeSVG, generateQRCodeDataURL } from '../src/utils/qrcode';

const testUrl = 'https://srisaisiri.vercel.app';
const svg = generateQRCodeSVG(testUrl);
const dataUrl = generateQRCodeDataURL(testUrl);

console.log('SVG Length:', svg.length);
console.log('Data URL Starts with:', dataUrl.slice(0, 40));
console.log('Test QR Code Generator SUCCESS!');
