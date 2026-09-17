// Re-resolves individual products whose photo didn't match the listing, without
// disturbing the ones that did. Usage:
//   node scripts/refine-images.cjs bz-2005="kitchen knife cutting board"
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const IMAGES = path.join(__dirname, '..', 'src', 'data', 'images.js');
const RE = /images\.unsplash\.com\/(photo-[a-zA-Z0-9_-]+)/g;

function idsFor(query) {
  return new Promise((resolve) => {
    execFile(
      'curl',
      ['-s', '--max-time', '12', `https://unsplash.com/s/photos/${encodeURIComponent(query)}`],
      { encoding: 'utf8', maxBuffer: 80 * 1024 * 1024 },
      (err, stdout) => {
        const html = stdout || (err && err.stdout) || '';
        resolve([...new Set([...html.matchAll(RE)].map((m) => m[1]))]);
      }
    );
  });
}

(async () => {
  const src = fs.readFileSync(IMAGES, 'utf8');
  const map = JSON.parse(src.match(/PHOTO_IDS = (\{[\s\S]*?\});/)[1]);

  const requests = process.argv.slice(2).map((arg) => {
    const i = arg.indexOf('=');
    return [arg.slice(0, i), arg.slice(i + 1).replace(/^"|"$/g, '')];
  });

  for (const [id, query] of requests) {
    const taken = new Set(Object.entries(map).filter(([k]) => k !== id).map(([, v]) => v));
    const ids = await idsFor(query);
    // Skip the photo this product already has, and anything another product uses.
    const pick = ids.find((p) => p !== map[id] && !taken.has(p));
    if (pick) {
      console.log(`${id}: ${map[id]} -> ${pick}   ("${query}", ${ids.length} candidates)`);
      map[id] = pick;
    } else {
      console.log(`${id}: no new candidate for "${query}"`);
    }
  }

  const updated = src.replace(/PHOTO_IDS = \{[\s\S]*?\};/, `PHOTO_IDS = ${JSON.stringify(map, null, 2)};`);
  fs.writeFileSync(IMAGES, updated, 'utf8');
  console.log(`\n${Object.keys(map).length} products mapped`);
})();
