const fs = require('fs');
const xml = fs.readFileSync('scratch/window_dump_profile.xml', 'utf8');

const regex = /(<\/?node[^>]*>)/g;
let match;
let depth = 0;
const nodes = [];
while ((match = regex.exec(xml)) !== null) {
  const token = match[1];
  if (token.startsWith('</node>')) {
    depth--;
  } else {
    const text = (token.match(/text="([^"]*)"/) || [])[1] || '';
    const bounds = (token.match(/bounds="([^"]*)"/) || [])[1] || '';
    const cls = (token.match(/class="([^"]*)"/) || [])[1] || '';
    const desc = (token.match(/content-desc="([^"]*)"/) || [])[1] || '';
    const id = (token.match(/resource-id="([^"]*)"/) || [])[1] || '';
    const isSelfClosing = token.endsWith('/>');
    nodes.push({ depth, text, bounds, cls, desc, id });
    if (!isSelfClosing) depth++;
  }
}

// Print nodes between depth 8 and 18
nodes.forEach((n, i) => {
  if (n.depth >= 8 && n.depth <= 18) {
    console.log(`${' '.repeat(n.depth)}[${i}] ${n.cls} bounds=${n.bounds} text="${n.text}" desc="${n.desc}" id="${n.id}"`);
  }
});
