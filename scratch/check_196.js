const fs = require('fs');
const file = process.argv[2] || 'scratch/window_dump_profile.xml';
const xml = fs.readFileSync(file, 'utf8');
const regex = /<node[^>]*bounds="\[0,0\]\[1440,196\]"[^>]*>/g;
let m;
let found = false;
while ((m = regex.exec(xml)) !== null) {
  console.log('FOUND:', m[0]);
  found = true;
}
if (!found) console.log('NOT FOUND in ' + file);
