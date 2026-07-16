const Jimp = require('jimp');
const path = require('path');

const SOURCE_IMAGE = 'C:\\Users\\Sharran Nandakumar\\.gemini\\antigravity-ide\\brain\\d6c6685e-d230-4f3f-a0c8-dec5467119aa\\attendify_app_icon_1784222415312.png';
const PUBLIC_DIR = path.join(__dirname, 'public');

async function resizeIcons() {
  try {
    const image = await Jimp.read(SOURCE_IMAGE);
    
    // Resize for PWA and favicon
    await image.clone().resize(192, 192).writeAsync(path.join(PUBLIC_DIR, 'pwa-192x192.png'));
    await image.clone().resize(512, 512).writeAsync(path.join(PUBLIC_DIR, 'pwa-512x512.png'));
    await image.clone().resize(180, 180).writeAsync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
    
    // create png favicons for modern browsers
    await image.clone().resize(32, 32).writeAsync(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
    await image.clone().resize(16, 16).writeAsync(path.join(PUBLIC_DIR, 'favicon-16x16.png'));

    console.log('Successfully generated all PWA icons!');
  } catch (err) {
    console.error('Error resizing icons:', err);
  }
}

resizeIcons();
