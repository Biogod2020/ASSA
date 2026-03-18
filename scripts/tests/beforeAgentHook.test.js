const assert = require('assert');
const { execSync } = require('child_process');

function runTest() {
    console.log("Running beforeAgentHook tool filtering tests...");
    
    const input = JSON.stringify({
        hook_event_name: "BeforeAgent",
        cwd: "/tmp",
        prompt: "Hello",
        timestamp: new Date().toISOString(),
        transcript_path: process.cwd() + "/scripts/tests/fixtures/mockTranscript.json"
    });

    const output = execSync(`node hooks/beforeAgentHook.js`, { input, encoding: 'utf8' });
    
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
    
    // In this transcript: run_shell_command (fail) -> read_file (success) -> run_shell_command (success)
    // The old logic would trigger Victory on the read_file. 
    // The new isomorphic logic should trigger Victory on the final run_shell_command because it matches the failing one.
    assert(ctx.includes("VICTORY DETECTED"), "Isomorphic Victory should have been detected");
    
    console.log("✅ Tool filtering logic works!");
}

try {
    runTest();
} catch (e) {
    console.error("❌ Test Failed:", e.message);
    process.exit(1);
}
