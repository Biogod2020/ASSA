const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

// Mock setup
const TMP_DIR = path.join(os.tmpdir(), 'assa-test-' + Date.now());
const MEMORY_DIR = path.join(TMP_DIR, '.memory');
const HOOKS_DIR = path.join(TMP_DIR, 'hooks');
const TEMPLATES_DIR = path.join(TMP_DIR, 'templates');
const LEDGER_PATH = path.join(MEMORY_DIR, 'evolution_ledger.json');

function setup() {
    if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true });
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
    fs.mkdirSync(HOOKS_DIR, { recursive: true });
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

    // Copy actual files to tmp for testing
    fs.copyFileSync('hooks/beforeAgentHook.js', path.join(HOOKS_DIR, 'beforeAgentHook.js'));
    fs.copyFileSync('hooks/healthCheck.js', path.join(HOOKS_DIR, 'healthCheck.js'));
    fs.mkdirSync(path.join(TMP_DIR, 'skills/assa-core/scripts'), { recursive: true });
    fs.copyFileSync('skills/assa-core/scripts/ledgerUtils.js', path.join(TMP_DIR, 'skills/assa-core/scripts/ledgerUtils.js'));
    
    // Create templates
    fs.writeFileSync(path.join(TEMPLATES_DIR, 'SOUL.md'), 'template-soul');
    fs.writeFileSync(path.join(TEMPLATES_DIR, 'USER_HANDBOOK.md'), 'template-handbook');
    fs.writeFileSync(path.join(TEMPLATES_DIR, 'index.json'), '{}');
}

function teardown() {
    fs.rmSync(TMP_DIR, { recursive: true });
}

function testRewindCascade() {
    console.log('Running: testRewindCascade...');
    setup();

    // 1. Setup ledger with a PENDING item
    const initialLedger = [{
        session_id: 's1',
        message_id: 'msg-to-rewind',
        status: 'PENDING',
        payload: { rule: 'Test' }
    }];
    fs.writeFileSync(LEDGER_PATH, JSON.stringify(initialLedger));

    // 2. Mock transcript WITHOUT the message_id
    const payload = JSON.stringify({
        transcript: [{ messageId: 'other-msg' }]
    });

    // 3. Run hook (ensure we are in TMP_DIR context)
    const result = spawnSync('node', ['hooks/beforeAgentHook.js'], {
        cwd: TMP_DIR,
        input: payload,
        encoding: 'utf8'
    });

    if (result.error) throw result.error;

    // 4. Verify ledger was updated to REWOUND
    const updatedLedger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
    assert.strictEqual(updatedLedger[0].status, 'REWOUND', 'Status should be REWOUND');
    console.log('✓ testRewindCascade passed');
    teardown();
}

function testContextInjection() {
    console.log('Running: testContextInjection...');
    setup();

    // 1. Setup files
    fs.writeFileSync(path.join(MEMORY_DIR, 'patterns.md'), 'LOCAL_PATTERN');
    const initialLedger = [{
        session_id: 's1',
        message_id: 'm1',
        status: 'PENDING',
        payload: { rule: 'L1_RULE' }
    }];
    fs.writeFileSync(LEDGER_PATH, JSON.stringify(initialLedger));

    const payload = JSON.stringify({
        transcript: [{ messageId: 'm1' }]
    });

    // 2. Run hook
    const result = spawnSync('node', ['hooks/beforeAgentHook.js'], {
        cwd: TMP_DIR,
        input: payload,
        encoding: 'utf8'
    });

    // 3. Verify Output
    const output = JSON.parse(result.stdout);
    const context = output.hookSpecificOutput.additionalContext;
    
    assert.ok(context.includes('LOCAL_PATTERN'), 'Should inject L2 patterns');
    assert.ok(context.includes('L1_RULE'), 'Should inject L1 pending rules');
    console.log('✓ testContextInjection passed');
    teardown();
}

try {
    testRewindCascade();
    testContextInjection();
    console.log('\nALL NODE TESTS PASSED!');
} catch (err) {
    console.error('\nTEST FAILED:');
    console.error(err);
    process.exit(1);
}
