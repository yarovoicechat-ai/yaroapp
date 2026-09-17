const fs = require('fs');
const xml = fs.readFileSync('scratch/window_dump_profile.xml', 'utf8');

const regex = /<node[^>]*class="android\.widget\.ScrollView"[^>]*>/g;
let m;
while ((m = regex.exec(xml)) !== null) {
  console.log(m[0]);
}
