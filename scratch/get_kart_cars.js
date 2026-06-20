const https = require('https');
async function get() {
  const html = await new Promise(r => https.get('https://kart.vosstaxi.no/', res => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => r(data));
  }));
  const match = html.match(/src="([^"]*\.js)"/);
  if (match) {
    console.log('Found JS:', match[1]);
    const js = await new Promise(r => https.get('https://kart.vosstaxi.no' + match[1], res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => r(data));
    }));
    
    const carsMatches = Array.from(js.matchAll(/licenseNo:\s*"([^"]+)",\s*regNo:\s*"([^"]+)",\s*bilmodell:\s*"([^"]+)",\s*farge:\s*"([^"]+)"/g));
    if (carsMatches.length > 0) {
      console.log('Found structured array in JS!');
      for(const m of carsMatches) {
        console.log(`Løyve: ${m[1]} | Skilt: ${m[2]} | Bil: ${m[3]} | Farge: ${m[4]}`);
      }
    } else {
      console.log('No exact car match found. Looking for occurrences of farge or bilmodell:');
      const fargeRegex = /.{0,50}farge.{0,50}/gi;
      let m;
      while((m = fargeRegex.exec(js)) !== null) {
        console.log('Match farge:', m[0]);
      }
      const modelRegex = /.{0,50}EQE.{0,50}/gi;
      while((m = modelRegex.exec(js)) !== null) {
        console.log('Match EQE:', m[0]);
      }
    }
  }
}
get();
