const fs = require('fs');
const xml = fs.readFileSync('scratch/window_dump_profile.xml', 'utf8');

// Find all nodes that touch y < 196
const regex = /<node[^>]+bounds=\"\[(\d+),(\d+)\]\[(\d+),(\d+)\]\"[^>]*>/g;
let m;
while ((m = regex.exec(xml)) !== null) {
  const [_, x1, y1, x2, y2] = m;
  if (parseInt(y2) <= 196 && parseInt(y2) > 0) {
    console.log(m[0]);
  }
}
