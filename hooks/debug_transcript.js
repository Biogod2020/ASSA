const fs = require('fs');
const inputData = fs.readFileSync(0, 'utf8');
const payload = JSON.parse(inputData);
const logPath = 'transcript_debug.log';
fs.appendFileSync(logPath, '--- Payload ---\n' + inputData + '\n');
if (payload.transcript_path && fs.existsSync(payload.transcript_path)) {
    const content = fs.readFileSync(payload.transcript_path, 'utf8');
    fs.appendFileSync(logPath, '--- Transcript File Content ---\n' + content + '\n');
}
console.log(JSON.stringify({ decision: 'allow' }));
