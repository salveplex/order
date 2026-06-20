const fs = require('fs');
const path = require('path');
function searchDir(dir) {
  if (!fs.existsSync(dir)) return;
  if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('.next') || dir.includes('dist')) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    try {
      if (fs.statSync(fullPath).isDirectory()) {
        searchDir(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('farge') || content.includes('modell') || content.includes('Mercedes')) {
          console.log('Found in:', fullPath);
        }
      }
    } catch(e) {}
  }
}
searchDir('/home/vosstaxi/sites');
searchDir('/var/www/kart.vosstaxi.no');
