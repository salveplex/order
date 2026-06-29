const fs = require('fs');
const js = fs.readFileSync('scratch/kart.js', 'utf8');
const urls = js.match(/https?:\/\/[a-zA-Z0-9.\-\/]+/g);
if (urls) {
  const uniqueUrls = [...new Set(urls)];
  console.log(uniqueUrls);
}
