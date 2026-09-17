const fs = require('fs');
const xml = fs.readFileSync('scratch/window_dump_profile.xml', 'utf8');

// Let's find the hierarchy from root down to Profile
const lines = [];
let currentIndent = 0;
// Parse XML roughly to find node hierarchy
const regex = /(<\/?node[^>]*>)/g;
let match;
const stack = [];
while ((match = regex.exec(xml)) !== null) {
  const token = match[1];
  if (token.startsWith('</node>')) {
    stack.pop();
  } else {
    const text = (token.match(/text="([^"]*)"/) || [])[1] || '';
    const bounds = (token.match(/bounds="([^"]*)"/) || [])[1] || '';
    const cls = (token.match(/class="([^"]*)"/) || [])[1] || '';
    const isSelfClosing = token.endsWith('/>');
    const nodeInfo = { text, bounds, cls };
    if (text === 'Profile' && bounds.includes('410')) {
      console.log('--- ANCESTOR STACK FOR PROFILE TITLE ---');
      stack.forEach((s, idx) => {
        console.log(`${idx}: <${s.cls}> bounds="${s.bounds}" text="${s.text}"`);
      });
      console.log(`TARGET: <${cls}> bounds="${bounds}" text="${text}"`);
      break;
    }
    if (!isSelfClosing) {
      stack.push(nodeInfo);
    }
  }
}
