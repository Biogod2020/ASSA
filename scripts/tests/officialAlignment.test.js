/**
 * Test for official payload alignment and reliability.
 */
const assert = require('assert');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runBeforeAgentAlignmentTest() {
    console.log("Running BeforeAgent Official Alignment Test...");
    
    const mockCwd = "/tmp/mock-cwd-" + Date.now();
    if (!fs.existsSync(mockCwd)) fs.mkdirSync(mockCwd, { recursive: true });

    const input = JSON.stringify({
        hook_event_name: "BeforeAgent",
        session_id: "test-session",
        cwd: mockCwd,
        prompt: "Hello",
        timestamp: new Date().toISOString()
    });

    const output = execSync(`node hooks/beforeAgentHook.js`, { input, encoding: 'utf8' });
    
    const responseObj = JSON.parse(output.split('\n').find(l => l.includes('"decision"')));
    
    assert(responseObj, "Failed to parse JSON response");
    
    console.log("Checking for hookEventName in output...");
    // This is EXPECTED TO FAIL currently
    assert.strictEqual(responseObj.hookSpecificOutput.hookEventName, "BeforeAgent", "hookEventName should be 'BeforeAgent'");
    
    console.log("✅ BeforeAgent Alignment Test PASSED!");
}

function runAfterToolAlignmentTest() {
    console.log("Running AfterTool Official Alignment Test...");
    
    const input = JSON.stringify({
        hook_event_name: "AfterTool",
        session_id: "test-session",
        cwd: process.cwd(),
        tool_name: "read_file",
        tool_input: { file_path: "test.txt" },
        tool_response: { status: "success", llmContent: "File content" },
        timestamp: new Date().toISOString()
    });

    const output = execSync(`node hooks/afterToolHook.js`, { input, encoding: 'utf8' });
    
    const responseObj = JSON.parse(output.split('\n').find(l => l.includes('"decision"')));
    
    assert(responseObj, "Failed to parse JSON response");
    
    console.log("Checking for hookEventName in output...");
    // This is EXPECTED TO FAIL currently
    assert.strictEqual(responseObj.hookSpecificOutput.hookEventName, "AfterTool", "hookEventName should be 'AfterTool'");
    
    console.log("✅ AfterTool Alignment Test PASSED!");
}

try {
    runBeforeAgentAlignmentTest();
    runAfterToolAlignmentTest();
} catch (e) {
    console.error("❌ Test Failed:", e.message);
    process.exit(1);
}
