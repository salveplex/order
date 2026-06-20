const fs = require('fs');
const s = JSON.parse(fs.readFileSync('swagger.json', 'utf8'));
const b = '/api/book/general';
const schemaRef = s.paths[b].post.requestBody.content['application/json'].schema['$ref'];
const schemaName = schemaRef.split('/').pop();
const schema = s.components.schemas[schemaName];
console.log('top-level:', Object.keys(schema.properties));
const passRef = schema.properties.passengers.items['$ref'].split('/').pop();
console.log('passenger:', Object.keys(s.components.schemas[passRef].properties));
