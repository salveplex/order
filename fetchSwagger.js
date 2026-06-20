async function getSwagger() {
  const r = await fetch('https://api.taxi4u.cab/swagger/v1/swagger.json');
  console.log(r.status);
  if (r.status === 200) {
      const data = await r.json();
      const fs = require('fs');
      fs.writeFileSync('swagger.json', JSON.stringify(data, null, 2));
      console.log('Saved to swagger.json');
  }
}
getSwagger();
