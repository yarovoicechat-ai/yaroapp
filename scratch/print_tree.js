const fs = require('fs');
const xml = fs.readFileSync('scratch/window_dump_profile.xml', 'utf8');

const regex = /(<\/?node[^>]*>)/g;
let m;
let depth = 0;
while ((m = regex.exec(xml)) !== null) {
  const token = m[1];
  if (token.startsWith('</node>')) {
    depth--;
  } else {
    const text = (token.match(/text="([^"]*)"/) || [])[1] || '';
    const bounds = (token.match(/bounds="([^"]*)"/) || [])[1] || '';
    const cls = (token.match(/class="([^"]*)"/) || [])[1] || '';
    const desc = (token.match(/content-desc="([^"]*)"/) || [])[1] || '';
    const id = (token.match(/resource-id="([^"]*)"/) || [])[1] || '';
    const isSelfClosing = token.endsWith('/>');
    
    // Check if node is in the first 25 nodes
    console.log(`${' '.repeat(depth * 2)}${cls} bounds=${bounds} id=${id} desc=${desc} text=${text}`);
    if (bounds.includes('410')) {
      break;
    }
    if (!isSelfClosing) depth++;
  }
}
