const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(__dirname, '..', 'assets');
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// SVG 1: Ícone principal da aplicação (1024x1024) - Fundo escuro com logo Nexora
const mainIconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#090d16"/>
    </linearGradient>
    <linearGradient id="tileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="30" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Fundo Principal -->
  <rect width="1024" height="1024" fill="url(#bgGrad)"/>
  
  <!-- Círculo de Brilho de Fundo -->
  <circle cx="512" cy="512" r="320" fill="#6366f1" opacity="0.15" filter="url(#glow)"/>

  <!-- Card do Ícone Central -->
  <rect x="192" y="192" width="640" height="640" rx="160" fill="url(#tileGrad)" filter="url(#shadow)"/>
  <rect x="192" y="192" width="640" height="640" rx="160" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="4"/>

  <!-- Barras do Logo Nexora (3 barras ascendentes) -->
  <g transform="translate(512, 512)">
    <!-- Barra 1 (Esquerda - Menor) -->
    <rect x="-170" y="-10" width="90" height="190" rx="24" fill="rgba(255,255,255,0.55)"/>
    
    <!-- Barra 2 (Centro - Média) -->
    <rect x="-45" y="-110" width="90" height="290" rx="24" fill="rgba(255,255,255,0.95)"/>
    
    <!-- Barra 3 (Direita - Alta Acentuada) -->
    <rect x="80" y="-210" width="90" height="390" rx="24" fill="#38bdf8"/>
  </g>
</svg>
`;

// SVG 2: Foreground para Adaptive Icon do Android (1024x1024)
const foregroundSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Tile central redimensionado para viewport seguro do Android -->
  <rect x="262" y="262" width="500" height="500" rx="125" fill="url(#tileGrad)" filter="url(#shadow)"/>
  <rect x="262" y="262" width="500" height="500" rx="125" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>

  <!-- Barras do Logo Nexora -->
  <g transform="translate(512, 512) scale(0.78)">
    <rect x="-170" y="-10" width="90" height="190" rx="24" fill="rgba(255,255,255,0.55)"/>
    <rect x="-45" y="-110" width="90" height="290" rx="24" fill="rgba(255,255,255,0.95)"/>
    <rect x="80" y="-210" width="90" height="390" rx="24" fill="#38bdf8"/>
  </g>
</svg>
`;

// SVG 3: Background para Adaptive Icon (1024x1024)
const backgroundSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#090d16"/>
</svg>
`;

// SVG 4: Monochrome Icon (1024x1024)
const monochromeSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(512, 512) scale(0.78)">
    <rect x="-170" y="-10" width="90" height="190" rx="24" fill="#ffffff"/>
    <rect x="-45" y="-110" width="90" height="290" rx="24" fill="#ffffff"/>
    <rect x="80" y="-210" width="90" height="390" rx="24" fill="#ffffff"/>
  </g>
</svg>
`;

async function gerar() {
  console.log('Gerando ícones PNG com sharp...');

  await sharp(Buffer.from(mainIconSvg)).resize(1024, 1024).png().toFile(path.join(assetsDir, 'icon.png'));
  await sharp(Buffer.from(foregroundSvg)).resize(1024, 1024).png().toFile(path.join(assetsDir, 'android-icon-foreground.png'));
  await sharp(Buffer.from(backgroundSvg)).resize(1024, 1024).png().toFile(path.join(assetsDir, 'android-icon-background.png'));
  await sharp(Buffer.from(monochromeSvg)).resize(1024, 1024).png().toFile(path.join(assetsDir, 'android-icon-monochrome.png'));
  await sharp(Buffer.from(mainIconSvg)).resize(512, 512).png().toFile(path.join(assetsDir, 'splash-icon.png'));
  await sharp(Buffer.from(mainIconSvg)).resize(48, 48).png().toFile(path.join(assetsDir, 'favicon.png'));

  console.log('Assets do Expo gerados com sucesso!');

  // Atualizar também os mipmaps nativos no Android res/
  const mipmaps = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
  ];

  for (const item of mipmaps) {
    const targetDir = path.join(androidResDir, item.dir);
    if (fs.existsSync(targetDir)) {
      await sharp(Buffer.from(mainIconSvg)).resize(item.size, item.size).webp().toFile(path.join(targetDir, 'ic_launcher.webp'));
      await sharp(Buffer.from(mainIconSvg)).resize(item.size, item.size).webp().toFile(path.join(targetDir, 'ic_launcher_round.webp'));
      await sharp(Buffer.from(foregroundSvg)).resize(item.fgSize, item.fgSize).webp().toFile(path.join(targetDir, 'ic_launcher_foreground.webp'));
      await sharp(Buffer.from(backgroundSvg)).resize(item.fgSize, item.fgSize).webp().toFile(path.join(targetDir, 'ic_launcher_background.webp'));
      await sharp(Buffer.from(monochromeSvg)).resize(item.fgSize, item.fgSize).webp().toFile(path.join(targetDir, 'ic_launcher_monochrome.webp'));
    }
  }

  console.log('Mipmaps nativos do Android atualizados em formato WebP!');
}

gerar().catch(err => {
  console.error('Erro ao gerar ícones:', err);
  process.exit(1);
});
