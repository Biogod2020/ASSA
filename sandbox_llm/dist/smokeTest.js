const { checkSystemHealth } = require('./healthCheck');

const health = checkSystemHealth();
console.log('ASSA System Health Integration Test:');
console.log(JSON.stringify(health, null, 2));

if (health.status === 'error') {
  console.error('Integration Test Failed: Critical health issues detected.');
  process.exit(1);
} else {
  console.log('Integration Test Passed.');
}
