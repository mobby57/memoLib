import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import favicons from 'favicons';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const publicDir = path.resolve(__dirname, '../public');
  const source = path.resolve(publicDir, 'logo-favicon.svg');

  try {
    await fs.access(source);
  } catch {
    console.error('Source SVG not found at', source);
    process.exit(1);
  }

  const configuration = {
    path: '/',
    appName: 'Memolib',
    appShortName: 'Memolib',
    appDescription: 'Démo ready: paiements, analytics, admin',
    developerName: 'Memolib',
    developerURL: null,
    icons: {
      android: true,
      appleIcon: true,
      appleStartup: false,
      favicons: true,
      windows: true,
      yandex: false,
      coast: false,
    },
    background: '#ffffff',
    theme_color: '#0ea5e9'
  };

  const { images, files, html } = await favicons(source, configuration);

  const writes = [];
  for (const img of images) {
    writes.push(fs.writeFile(path.join(publicDir, img.name), img.contents));
  }
  for (const file of files) {
    writes.push(fs.writeFile(path.join(publicDir, file.name), file.contents));
  }
  await Promise.all(writes);

  const manifestPath = path.join(publicDir, 'favicons.html');
  await fs.writeFile(manifestPath, html.join('\n'));
  console.log('Favicons generated into', publicDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
