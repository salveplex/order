const fs = require('fs');
let code = fs.readFileSync('lib/attributes.ts', 'utf8');
code = code.replace(/no:\s*['"][^'"]*['"],\s*/g, '');
fs.writeFileSync('lib/attributes.ts', code);
