const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { checkSystemHealth } = require('../../hooks/healthCheck');

const TMP_DIR = path.join(os.tmpdir(), 'assa-health-test-' + Date.now());
const MEMORY_DIR = path.join(TMP_DIR, '.memory');
const GLOBAL_DIR = path.join(TMP_DIR, '.gemini/assa');

function setup() {
    if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true });
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
    fs.mkdirSync(GLOBAL_DIR, { recursive: true });
}

function teardown() {
    fs.rmSync(TMP_DIR, { recursive: true });
}

function testHealthCheckAgentFlag() {
    console.log('Running: testHealthCheckAgentFlag...');
    setup();
    
    const settingsPath = path.join(TMP_DIR, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({
        experimental: { enableAgents: true }
    }));

    const result = checkSystemHealth(TMP_DIR, { settingsPath, memoryDir: MEMORY_DIR, globalDir: GLOBAL_DIR });
    assert.strictEqual(result.enableAgents, true, 'Should detect enableAgents is true');
    assert.strictEqual(result.status, 'healthy', 'Status should be healthy');
    console.log('✓ testHealthCheckAgentFlag passed');
    teardown();
}

function testHealthCheckWarningIfAgentsDisabled() {
    console.log('Running: testHealthCheckWarningIfAgentsDisabled...');
    setup();
    
    const settingsPath = path.join(TMP_DIR, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({
        experimental: { enableAgents: false }
    }));

    const result = checkSystemHealth(TMP_DIR, { settingsPath, memoryDir: MEMORY_DIR, globalDir: GLOBAL_DIR });
    assert.strictEqual(result.enableAgents, false, 'Should detect enableAgents is false');
    assert.strictEqual(result.status, 'warning', 'Status should be warning');
    assert.ok(result.warnings[0].includes('Subagents are disabled'), 'Warning should mention subagents');
    console.log('✓ testHealthCheckWarningIfAgentsDisabled passed');
    teardown();
}

function testHealthCheckDirectoryDetection() {
    console.log('Running: testHealthCheckDirectoryDetection...');
    setup();
    
    // Test missing memory dir
    const settingsPath = path.join(TMP_DIR, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({ experimental: { enableAgents: true } }));
    
    const result = checkSystemHealth(TMP_DIR, { 
        settingsPath, 
        memoryDir: path.join(TMP_DIR, 'missing'), 
        globalDir: GLOBAL_DIR 
    });
    
    assert.strictEqual(result.memoryDirExists, false, 'Should detect memory directory is missing');
    assert.strictEqual(result.status, 'warning', 'Status should be warning');
    console.log('✓ testHealthCheckDirectoryDetection passed');
    teardown();
}

try {
    testHealthCheckAgentFlag();
    testHealthCheckWarningIfAgentsDisabled();
    testHealthCheckDirectoryDetection();
    console.log('\nALL HEALTH CHECK TESTS PASSED!');
} catch (err) {
    console.error('\nTEST FAILED:');
    console.error(err);
    process.exit(1);
}
