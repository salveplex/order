async function checkKart() {
  const html = await (await fetch('https://kart.vosstaxi.no/')).text();
  const scriptRegex = /<script[^>]*src=["']([^"']*\.js)["']/g;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    let scriptUrl = match[1];
    if (scriptUrl.startsWith('/')) scriptUrl = 'https://kart.vosstaxi.no' + scriptUrl;
    console.log('Fetching', scriptUrl);
    const js = await (await fetch(scriptUrl)).text();
    const eqeIndex = js.indexOf('EQE');
    if (eqeIndex > -1) {
      console.log('Found EQE at index', eqeIndex);
      console.log(js.substring(Math.max(0, eqeIndex - 500), eqeIndex + 1000));
    }
  }
}
checkKart();
