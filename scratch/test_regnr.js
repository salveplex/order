async function lookup(regnr) {
  try {
    const res = await fetch(`https://regnr.info/${regnr}`);
    const html = await res.text();
    const modelMatch = html.match(/<title>([^<]+)<\/title>/);
    console.log(modelMatch ? modelMatch[1] : 'No title');
    // search for Merke, Modell, Farge
    const regex = /Merke:<\/dt><dd>([^<]+)<\/dd>.*?Modell:<\/dt><dd>([^<]+)<\/dd>/s;
    const match = regex.exec(html);
    if (match) {
        console.log('Merke:', match[1], 'Modell:', match[2]);
    } else {
        const m = html.match(/Merke:<\/dt>\s*<dd>\s*<a[^>]*>([^<]+)<\/a>/s);
        console.log('Merke:', m ? m[1] : 'Not found');
    }
  } catch (e) {
    console.error(e);
  }
}
lookup('TF34063');
