const fs = require('fs');
const xml = fs.readFileSync('scratch/window_dump_profile.xml', 'utf8');

const regex = /(<\/?node[^>]*>)/g;
let match;
let index = 0;
while ((match = regex.exec(xml)) !== null) {
  const token = match[1];
  if (!token.startsWith('</node>')) {
    index++;
    if (index >= 8 && index <= 25) {
      console.log(`Node ${index}: ${token}`);
    }
  }
}
