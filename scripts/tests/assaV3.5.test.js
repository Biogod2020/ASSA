const assert = require('assert');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TMP_DIR = path.join(os.tmpdir(), 'assa-test-' + Date.now());
const GEMINI_DIR = path.join(TMP_DIR, '.gemini', 'assa');
const LIBRARY_DIR = path.join(GEMINI_DIR, 'LIBRARY');

function setupMock() {
    if (!fs.existsSync(LIBRARY_DIR)) fs.mkdirSync(LIBRARY_DIR, { recursive: true });

    const graph = {
        rules: {
            "SEED_RULE": {
                "level": "G3",
                "path": "LIBRARY/seed_rule.md",
                "depends_on": ["G1_RULE", "G2_RULE", "G3_RULE"]
            },
            "G1_RULE": {
                "level": "G1",
                "path": "LIBRARY/foundation_rule.md",
                "rationale": "Foundation rule rationale"
            },
            "G2_RULE": {
                "level": "G2",
                "path": "LIBRARY/domain_rule.md",
                "rationale": "Domain rule rationale"
            },
            "G3_RULE": {
                "level": "G3",
                "path": "LIBRARY/fragment_rule.md",
                "rationale": "Fragment rule rationale"
            },
            "G1_UNUSED": {
                "level": "G1",
                "path": "LIBRARY/unused_foundation.md",
                "rationale": "Unused foundation rationale"
            }
        }
    };
    fs.writeFileSync(path.join(GEMINI_DIR, 'graph.json'), JSON.stringify(graph));

    const index = {
        mappings: [
            {
                "domains": [process.cwd().split(path.sep).pop()],
                "rule_id": "SEED_RULE"
            }
        ]
    };
    fs.writeFileSync(path.join(LIBRARY_DIR, 'index.json'), JSON.stringify(index));

    fs.writeFileSync(path.join(LIBRARY_DIR, 'seed_rule.md'), "Seed rule content");
    fs.writeFileSync(path.join(LIBRARY_DIR, 'foundation_rule.md'), "Foundation rule content");
    fs.writeFileSync(path.join(LIBRARY_DIR, 'domain_rule.md'), "Domain rule content");
    fs.writeFileSync(path.join(LIBRARY_DIR, 'fragment_rule.md'), "Fragment rule content");
    fs.writeFileSync(path.join(LIBRARY_DIR, 'unused_foundation.md'), "Unused foundation content");
    
    // Mock SOUL and HANDBOOK to avoid warnings or just because they are expected
    fs.writeFileSync(path.join(GEMINI_DIR, 'SOUL.md'), "SOUL content");
    fs.writeFileSync(path.join(GEMINI_DIR, 'USER_HANDBOOK.md'), "HANDBOOK content");
}

function runTest() {
    console.log("Running ASSA V3.5 Enhanced Injection Test...");
    setupMock();

    const input = JSON.stringify({
        hook_event_name: "BeforeAgent",
        agentName: "main",
        sessionId: "test-session",
        prompt: "Hello",
        overrides: {}
    });

    const output = execSync(`node hooks/beforeAgentHook.js`, { 
        input, 
        encoding: 'utf8',
        env: { ...process.env, HOME: TMP_DIR }
    });

    const lines = output.split('\n');
    let responseObj = null;
    for (const line of lines) {
        if (line.trim().startsWith('{') && line.includes('"decision"')) {
            try {
                responseObj = JSON.parse(line);
                break;
            } catch (e) {}
        }
    }

    assert(responseObj, "Failed to parse JSON response from hook");
    const ctx = responseObj.hookSpecificOutput.additionalContext || "";
    
    console.log("Checking SEED_RULE (Meat)...");
    assert(ctx.includes("Seed rule content"), "SEED_RULE content should be present");

    console.log("Checking G1_RULE (Foundation - should be Meat in V3.5)...");
    const hasG1Content = ctx.includes("Foundation rule content");
    assert(hasG1Content, "G1_RULE (Foundation) should be injected as MEAT, even if it is a dependency");

    console.log("Checking G2_RULE (Domain - should be Meat in V3.5)...");
    const hasG2Content = ctx.includes("Domain rule content");
    assert(hasG2Content, "G2_RULE (Domain) should be injected as MEAT, even if it is a dependency");

    console.log("Checking G1_UNUSED (Foundation - should be ALWAYS Meat in V3.5)...");
    const hasUnusedG1Content = ctx.includes("Unused foundation content");
    assert(hasUnusedG1Content, "G1_UNUSED (Foundation) should be injected as MEAT, even if it's not a dependency of a seed");
    
    console.log("Checking G3_RULE (Fragment - should be Skeleton)...");
    const hasG3Content = ctx.includes("Fragment rule content");
    const hasG3Rationale = ctx.includes("Fragment rule rationale");

    assert(hasG3Rationale, "G3_RULE rationale should be present in Skeleton");
    assert(!hasG3Content, "G3_RULE content should NOT be present (should be Skeleton)");
    
    console.log("✅ ASSA V3.5 Enhanced Injection Test PASSED!");
}

try {
    runTest();
} catch (e) {
    console.error("❌ Test Failed:", e.message);
    process.exit(1);
} finally {
    // Cleanup
    // fs.rmSync(TMP_DIR, { recursive: true, force: true });
}
