const fs = require('fs');
const inputData = fs.readFileSync(0, 'utf8');
fs.writeFileSync('payload_debug.json', inputData);
console.log(JSON.stringify({ decision: 'allow' }));
