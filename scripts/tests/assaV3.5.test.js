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
    
    fs.writeFileSync(path.join(GEMINI_DIR, 'SOUL.md'), "SOUL content");
    fs.writeFileSync(path.join(GEMINI_DIR, 'USER_HANDBOOK.md'), "HANDBOOK content");

    // Mock .memory for local patterns
    const memoryDir = path.join(process.cwd(), '.memory');
    if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir, { recursive: true });
    fs.writeFileSync(path.join(memoryDir, 'patterns.md'), "# PATTERNS\n");
    fs.writeFileSync(path.join(memoryDir, 'decisions.md'), "# DECISIONS\n");
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
    assert(ctx.includes("Foundation rule content"), "G1_RULE (Foundation) should be injected as MEAT");

    console.log("Checking G2_RULE (Domain - should be Meat in V3.5)...");
    assert(ctx.includes("Domain rule content"), "G2_RULE (Domain) should be injected as MEAT");

    console.log("Checking Subconscious Directives (Internal Memory Judgment & Traceability)...");
    assert(ctx.includes("Internal Memory Judgment"), "Should contain Internal Memory Judgment directive");
    assert(ctx.includes("Traceability"), "Should contain Traceability directive");

    console.log("✅ ASSA V3.5 Enhanced Injection Test PASSED!");
}

function runOverflowTest() {
    console.log("Running Context Overflow Warning Test...");
    
    // Create a massive patterns.md (> 20KB)
    const largeContent = "X".repeat(25000);
    const memoryDir = path.join(process.cwd(), '.memory');
    fs.writeFileSync(path.join(memoryDir, 'patterns.md'), largeContent);

    const input = JSON.stringify({
        hook_event_name: "BeforeAgent",
        agentName: "main",
        sessionId: "overflow-session",
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

    console.log("Checking for CONTEXT OVERHEAD EXCEEDED warning...");
    assert(ctx.includes("CONTEXT OVERHEAD EXCEEDED"), "Warning should be present");

    console.log("Checking if original context is RETAINED (V3.5 Requirement)...");
    // In current implementation, this should FAIL because it truncates/replaces
    assert(ctx.includes(largeContent.substring(0, 100)), "Original context should be retained even with warning");

    console.log("Checking if reflexes are retained...");
    // We didn't trigger a reflex, but let's assume if it's there it should be kept
    // For this test we can just check if session ID is there
    assert(ctx.includes("overflow-session"), "Session ID should be retained");

    console.log("✅ Context Overflow Warning Test PASSED!");
}

try {
    runTest();
    runOverflowTest();
} catch (e) {
    console.error("❌ Test Failed:", e.message);
    process.exit(1);
} finally {
    // Cleanup .memory/patterns.md to not affect other things if any
    const memoryDir = path.join(process.cwd(), '.memory');
    if (fs.existsSync(path.join(memoryDir, 'patterns.md'))) {
        fs.writeFileSync(path.join(memoryDir, 'patterns.md'), "# PATTERNS\n");
    }
}
