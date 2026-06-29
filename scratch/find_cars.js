const fs = require('fs');
const js = fs.readFileSync('scratch/kart.js', 'utf8');

// The JS bundle from Vite might have shortened keys.
// Let's search for some known cars like "VOLVO EX90" or "VE 2133"
const match = js.match(/.{0,100}VE 2133.{0,100}/g);
console.log('Matches for VE 2133:', match);

const regex = /licenseNo:\s*"([^"]+)"|bilmodell:\s*"([^"]+)"|farge:\s*"([^"]+)"/g;
let m;
let findings = [];
while ((m = regex.exec(js)) !== null) {
  findings.push(m[0]);
}
console.log('Found fields:', findings.length);

const fullObjectRegex = /\{[^}]*licenseNo[^}]*\}/g;
const objects = js.match(fullObjectRegex);
if (objects) {
  console.log('Found objects with licenseNo:', objects.length);
  console.log(objects.slice(0, 5));
}
