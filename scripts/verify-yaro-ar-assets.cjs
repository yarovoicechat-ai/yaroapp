const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto'),
  assert = require('assert/strict');
const app = path.resolve(__dirname, '..'),
  root = path.join(app, 'shared/ar-assets');
const names = [
  'Yaro Beauty',
  'Pink Glow',
  'Rosy Cheeks',
  'Soft Makeup',
  'Golden Shine',
  'Puppy',
  'Bunny',
  'Kitty',
  'Panda',
  'Fox',
  'Royal Crown',
  'Heart Glasses',
  'Butterfly Hair',
  'Golden Earrings',
  'Cyber Headset',
  'Angel',
  'Devil',
  'Fairy',
  'Ice Queen',
  'Fire King',
  'Anime Eyes',
  'Anime Blush',
  'Magic Eyes',
  'Anime Cat',
  'Star Eyes',
  'Love Hearts',
  'Cry Baby',
  'Funny Face',
  'Happy Spark',
  'Angry Face',
  'Butterflies',
  'Flower Crown',
  'Snowfall',
  'Star Shower',
  'Rainbow Aura',
  'Birthday',
  'Disco King',
  'Confetti',
  'Neon Party',
  'Gold Rain',
  'Diamond Face',
  'Hologram',
  'Dragon Mask',
  'Crystal Butterfly',
  'Yaro Royal',
  'Neon Rings',
  'Galaxy Face',
  'Robot Face',
  'Flame Face',
  'Yaro Signature',
];
const manifests = fs
  .readdirSync(path.join(root, 'manifests'))
  .filter(file => file.endsWith('.json'))
  .map(file =>
    JSON.parse(fs.readFileSync(path.join(root, 'manifests', file), 'utf8')),
  );
assert.equal(manifests.length, 50);
assert.equal(new Set(manifests.map(effect => effect.id)).size, 50);
assert.deepEqual(manifests.map(effect => effect.name).sort(), names.sort());
for (const effect of manifests) {
  assert.ok(
    effect.platforms.includes('android') && effect.platforms.includes('ios'),
  );
  assert.ok(
    effect.thumbnailSvg.startsWith('<svg') &&
      !effect.thumbnailSvg.includes('href='),
  );
  assert.equal(
    fs.readFileSync(path.join(root, 'thumbnails', effect.id + '.svg'), 'utf8'),
    effect.thumbnailSvg,
  );
  const local = path.join(
    app,
    'src/features/YaroAR/effects',
    effect.category.toLowerCase(),
    effect.id,
    'manifest.json',
  );
  assert.deepEqual(JSON.parse(fs.readFileSync(local, 'utf8')), effect);
  if (effect.status !== 'pending')
    assert.ok(
      fs.existsSync(path.resolve(app, effect.assetPath)),
      effect.assetPath,
    );
  else
    assert.ok(
      effect.pendingReason,
      'Pending effects must explain missing assets',
    );
}
const hash = crypto
  .createHash('sha256')
  .update(fs.readFileSync(path.join(root, 'models/face_landmarker.task')))
  .digest('hex');
assert.equal(
  hash,
  '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff',
);
assert.ok(
  fs.existsSync(path.join(root, 'shaders/beauty.frag')) &&
    fs.existsSync(path.join(root, 'shaders/beauty.metal')),
);
assert.ok(fs.existsSync(path.join(root, 'licenses/MediaPipe-LICENSE.txt')));
console.log(
  JSON.stringify(
    {
      definitions: manifests.length,
      experimental: manifests.filter(effect => effect.status === 'experimental')
        .length,
      pending: manifests.filter(effect => effect.status === 'pending').length,
      verified: manifests.filter(effect => effect.status === 'verified').length,
      modelSha256: hash,
    },
    null,
    2,
  ),
);
