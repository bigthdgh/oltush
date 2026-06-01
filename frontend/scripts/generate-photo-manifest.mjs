/**
 * Scans public/photos/items/ and generates src/data/photoManifest.json
 * Run: node scripts/generate-photo-manifest.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = path.join(__dirname, '..', 'public', 'photos', 'items');
const OUT_FILE   = path.join(__dirname, '..', 'src', 'data', 'photoManifest.json');

const SUPPORTED = /\.(jpg|jpeg|png|webp)$/i;

function scan() {
  const manifest = {};

  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  }

  const folders = fs.readdirSync(PHOTOS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const folder of folders) {
    const folderPath = path.join(PHOTOS_DIR, folder);
    const files = fs.readdirSync(folderPath, { withFileTypes: true });

    const gallery = [];
    let cover = null;

    for (const f of files) {
      if (!f.isFile()) continue;
      if (!SUPPORTED.test(f.name)) continue;

      const relative = `/photos/items/${folder}/${f.name}`;

      if (f.name.toLowerCase().startsWith('cover') || f.name.toLowerCase().includes('обложка')) {
        if (!cover) cover = relative;
      }
      gallery.push(relative);
    }

    // Try cover/ subfolder
    const coverDir = path.join(folderPath, 'cover');
    if (fs.existsSync(coverDir)) {
      const coverFiles = fs.readdirSync(coverDir, { withFileTypes: true })
        .filter(d => d.isFile() && SUPPORTED.test(d.name))
        .map(d => `/photos/items/${folder}/cover/${d.name}`);
      if (coverFiles.length > 0) {
        cover = coverFiles[0];
      }
    }

    // Deduplicate and sort (exclude cover)
    const uniqueGallery = [...new Set(gallery)]
      .filter(u => u !== cover)
      .sort();

    manifest[folder] = {
      cover,
      gallery: uniqueGallery,
    };
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Generated ${OUT_FILE} — ${Object.keys(manifest).length} folders`);
}

scan();
