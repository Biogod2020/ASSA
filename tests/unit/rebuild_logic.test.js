const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/**
 * TDD Test Suite for ASSA V3.5 Weaver Engine
 */
function testWeaver() {
    console.log('--- ASSA TDD: Testing Weaver Engine ---');

    const testLibDir = path.join(__dirname, 'test_library');
    const testGlobalDir = path.join(__dirname, 'test_global');
    const scriptPath = path.join(__dirname, '../../templates/rebuildGraph.js');

    function cleanup() {
        if (fs.existsSync(testLibDir)) fs.rmSync(testLibDir, { recursive: true, force: true });
        if (fs.existsSync(testGlobalDir)) fs.rmSync(testGlobalDir, { recursive: true, force: true });
    }

    // Fresh setup
    cleanup();
    fs.mkdirSync(testLibDir, { recursive: true });
    fs.mkdirSync(testGlobalDir, { recursive: true });

    try {
        const run = () => spawnSync('node', [scriptPath], {
            env: { 
                ...process.env, 
                ASSA_GLOBAL_DIR: testGlobalDir,
                ASSA_LIBRARY_DIR: testLibDir
            }
        });

        // --- TEST 1: Basic Indexing ---
        console.log('Test 1: Basic Indexing...');
        fs.writeFileSync(path.join(testLibDir, 'P-TEST-BASIC.md'), `---
id: P-TEST-BASIC
level: G1
rationale: "Testing basic indexing"
triggers: [test-trigger]
---
# Content`);

        const result = run();
        if (result.status !== 0) throw new Error(`Script failed: ${result.stderr.toString()}`);

        const graph = JSON.parse(fs.readFileSync(path.join(testGlobalDir, 'graph.json'), 'utf8'));
        const index = JSON.parse(fs.readFileSync(path.join(testLibDir, 'index.json'), 'utf8'));

        if (!graph.rules['P-TEST-BASIC']) throw new Error('Rule P-TEST-BASIC not found in graph');
        if (index.mappings[0].rule_id !== 'P-TEST-BASIC') throw new Error('Index mapping mismatch');

        console.log('✅ Test 1 Passed');

        // --- TEST 2: ID Collision ---
        console.log('Test 2: ID Collision Detection...');
        fs.writeFileSync(path.join(testLibDir, 'P-TEST-DUPE.md'), `---
id: P-TEST-BASIC
level: G2
---`);
        
        const result2 = run();
        if (result2.status !== 0 && result2.stderr.toString().includes('Duplicate ID detected')) {
            console.log('✅ Test 2 Passed (Caught Collision)');
        } else {
            console.error('❌ Test 2 Failed: Did not catch duplicate ID');
            console.error('STDOUT:', result2.stdout.toString());
            console.error('STDERR:', result2.stderr.toString());
            process.exit(1);
        }

        // --- TEST 3: Broken Link Warning ---
        console.log('Test 3: Broken Link Warning...');
        // Remove the duplicate first
        fs.unlinkSync(path.join(testLibDir, 'P-TEST-DUPE.md'));
        fs.writeFileSync(path.join(testLibDir, 'P-TEST-LINK.md'), `---
id: P-TEST-LINK
depends_on: [MISSING-ID]
---`);
        
        const result3 = run();
        if (result3.stderr.toString().includes('Warning: Rule P-TEST-LINK depends on missing rule: MISSING-ID')) {
            console.log('✅ Test 3 Passed (Warned on Broken Link)');
        } else {
            console.error('❌ Test 3 Failed: Did not warn on broken link');
            process.exit(1);
        }

    } finally {
        cleanup();
    }
}

testWeaver();
