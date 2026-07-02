const fs = require('fs');
const path = require('path');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4a9cc2" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#2c6e91" stop-opacity="0.6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#g1)"/>
  <path d="M0 320 Q128 280 256 320 Q384 360 512 320 L512 512 L0 512Z" fill="url(#g2)" opacity="0.5"/>
  <path d="M0 380 Q128 340 256 380 Q384 420 512 380 L512 512 L0 512Z" fill="url(#g2)" opacity="0.35"/>
  <path d="M160 280 L200 340 L312 340 L352 280Z" fill="#c9a96e"/>
  <path d="M180 295 L215 340 L297 340 L332 295Z" fill="#e8d5b0"/>
  <rect x="220" y="220" width="72" height="60" rx="4" fill="#f8f5ef"/>
  <rect x="230" y="235" width="20" height="20" rx="2" fill="#4a9cc2"/>
  <rect x="262" y="235" width="20" height="20" rx="2" fill="#4a9cc2"/>
  <rect x="236" y="190" width="8" height="30" rx="2" fill="#c9a96e"/>
  <circle cx="380" cy="100" r="36" fill="#e8d5b0" opacity="0.9"/>
  <circle cx="380" cy="100" r="20" fill="#c9a96e"/>
  <line x1="380" y1="70" x2="380" y2="130" stroke="#0f172a" stroke-width="2" opacity="0.6"/>
  <line x1="350" y1="100" x2="410" y2="100" stroke="#0f172a" stroke-width="2" opacity="0.6"/>
  <polygon points="380,75 374,110 380,108 386,110" fill="#f8f5ef"/>
  <polygon points="380,125 374,90 380,92 386,90" fill="#f8f5ef" opacity="0.5"/>
  <text x="256" y="430" text-anchor="middle" font-family="Noto Sans TC, sans-serif" font-size="42" font-weight="700" fill="#f8f5ef" letter-spacing="4">XM 0708</text>
  <text x="256" y="468" text-anchor="middle" font-family="Noto Sans TC, sans-serif" font-size="24" font-weight="400" fill="#c9a96e" letter-spacing="6">KINMEN-XIAMEN</text>
</svg>`;

const outPath = path.join(__dirname, '..', 'public', 'icon.svg');
fs.writeFileSync(outPath, svg.trim(), 'utf-8');
console.log('Icon created at', outPath);