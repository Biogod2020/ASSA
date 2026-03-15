const fs = require('fs');
const inputData = fs.readFileSync(0, 'utf8');
fs.writeFileSync('/Users/jay/LocalProjects/self_evolement/last_payload.json', inputData);
console.log(JSON.stringify({ decision: 'allow' }));
