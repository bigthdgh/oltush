/**
 * Photo resolution helpers for Oltush
 *
 * Convention: put photos into frontend/public/photos/items/{folder}/
 *   - cover/  — подпапка для обложки (любое имя файла, берётся первый)
 *   - root    — остальные файлы объекта идут в галерею
 *
 * Manifest is generated at build time by scripts/generate-photo-manifest.mjs
 * and imported here. Run `npm run photos` to regenerate after adding files.
 */

import manifest from '../data/photoManifest.json';

const ITEM_FOLDER = {
  1:  '01_domik1',
  2:  '02_domik2',
  3:  '03_domik3',
  4:  '04_domik4',
  5:  '05_domik5',
  6:  '06_domik6',
  7:  '07_domik7',
  8:  '08_domik8',
  9:  '09_banya',
  10: '10_kupel',
};

function getFolder(itemId) {
  return ITEM_FOLDER[itemId] || String(itemId);
}

function getManifestEntry(itemId) {
  const folder = getFolder(itemId);
  return manifest[folder] || { cover: null, gallery: [] };
}

/**
 * Get all gallery photos for an item.
 */
export function getItemPhotos(item, max = 10) {
  // Backend override
  if (Array.isArray(item.photos) && item.photos.length > 0) return item.photos;
  if (item.photo_url) return [{ url: item.photo_url, caption: item.name }];

  const entry = getManifestEntry(item.id);
  const urls = entry.gallery.slice(0, max);

  if (urls.length === 0) return getDefaultPhotos(item.name);

  return urls.map((url, i) => ({
    url,
    caption: i === 0 ? item.name : `${item.name} — фото ${i + 1}`,
  }));
}

/**
 * Get cover photo. Tries cover/ subfolder first, then first gallery photo.
 */
export function getItemCoverPhoto(item) {
  if (item.photo_url) return item.photo_url;

  const entry = getManifestEntry(item.id);
  if (entry.cover) return entry.cover;

  const gallery = getItemPhotos(item, 1);
  return gallery[0]?.url || getDefaultPhotos()[0].url;
}

/**
 * Default fallback gallery (Unsplash) used when no local photos exist.
 */
export function getDefaultPhotos(itemName = 'Объект') {
  return [
    { url: 'https://images.unsplash.com/photo-1449156493391-d2cfa28e468b?w=800&q=80', caption: 'Вид на лес' },
    { url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80', caption: 'Уютный интерьер' },
    { url: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=800&q=80', caption: 'Природа' },
  ];
}
