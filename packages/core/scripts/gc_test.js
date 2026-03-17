function checkMemory() {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`Memory used: ${Math.round(used * 100) / 100} MB`);
}

console.log('Starting Memory Test...');
checkMemory();

try {
  console.log('Attempting manual GC...');
  global.gc(); // This will fail by default
  console.log('GC successful!');
} catch (e) {
  console.error('GC Failed: ' + e.message);
  process.exit(1);
}

checkMemory();
