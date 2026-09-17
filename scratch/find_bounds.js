const fs = require('fs');
const xml = fs.readFileSync('scratch/window_dump_profile.xml', 'utf8');
xml.split('<node ').forEach((node, i) => {
  if (node.includes('text="Profile"') || node.includes('Web Duniya') || node.includes('statusBarBackground')) {
    const textMatch = node.match(/text="([^"]*)"/);
    const boundsMatch = node.match(/bounds="([^"]*)"/);
    const classMatch = node.match(/class="([^"]*)"/);
    console.log(`Match: text="${textMatch ? textMatch[1] : ''}" bounds="${boundsMatch ? boundsMatch[1] : ''}" class="${classMatch ? classMatch[1] : ''}"`);
  }
});
