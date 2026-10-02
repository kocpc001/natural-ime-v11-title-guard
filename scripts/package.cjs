// Deterministic stored ZIP, using only Node.js built-ins. Explicit file whitelist.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extension/manifest.json'), 'utf8'));
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
if (version !== manifest.version) throw new Error('Package and manifest versions differ');
const prefix = 'natural-ime-v11-title-guard/';
const files = [
  ['manifest.json', 'extension/manifest.json'],
  ['title-guard.js', 'extension/title-guard.js'],
  ['telegram-composition-guard.js', 'extension/telegram-composition-guard.js'],
  ['gmail-composition-filter.js', 'extension/gmail-composition-filter.js'],
  ['LICENSE', 'LICENSE'],
  ['README.md', 'README.md'],
  ['README.en.md', 'README.en.md'],
  ['CHANGELOG.md', 'CHANGELOG.md'],
  ['docs/diagnosis.zh-TW.md', 'docs/diagnosis.zh-TW.md'],
  ['docs/known-issues.zh-TW.md', 'docs/known-issues.zh-TW.md']
];
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let i = 0; i < 8; i++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  return c >>> 0;
});
function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
const locals = [], centrals = [];
let offset = 0;
for (const [target, source] of files) {
  const name = Buffer.from(prefix + target);
  // Normalize tracked text so archives are identical across Windows and Linux.
  const data = Buffer.from(fs.readFileSync(path.join(root, source), 'utf8').replace(/\r\n/g, '\n'));
  const crc = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034B50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x800, 6); // UTF-8 names
  local.writeUInt16LE(33, 12); // 1980-01-01, fixed timestamp
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014B50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x800, 8);
  central.writeUInt16LE(33, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);
  locals.push(local, name, data);
  centrals.push(central, name);
  offset += local.length + name.length + data.length;
}
const directory = Buffer.concat(centrals);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054B50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(directory.length, 12);
end.writeUInt32LE(offset, 16);
const zip = Buffer.concat([...locals, directory, end]);
const filename = `natural-ime-v11-title-guard-v${version}.zip`;
const out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, filename), zip);
fs.writeFileSync(path.join(out, 'SHA256SUMS.txt'), `${crypto.createHash('sha256').update(zip).digest('hex')}  ${filename}\n`);
console.log(`Packaged ${files.length} files: dist/${filename}`);
