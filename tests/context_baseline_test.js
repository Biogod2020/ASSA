const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock data for testing
const mockPayload = {
    prompt: "Test prompt",
    session_id: "test-session",
    cwd: process.cwd(),
    agentName: "main",
    transcript_path: path.join(os.tmpdir(), 'mock_transcript.json')
};

// Create a mock transcript file
fs.writeFileSync(mockPayload.transcript_path, JSON.stringify({ messages: [] }));

// Mock stdin for the hook script
const hookPath = path.resolve(__dirname, '../hooks/beforeAgentHook.js');

const { spawnSync } = require('child_process');

console.log("--- Baseline Context Measurement ---");
const result = spawnSync('node', [hookPath], {
    input: JSON.stringify(mockPayload),
    encoding: 'utf8'
});

if (result.error) {
    console.error("Error executing hook:", result.error);
} else {
    try {
        const output = JSON.parse(result.stdout);
        const context = output.hookSpecificOutput.additionalContext;
        console.log(`Additional Context Length: ${context.length} bytes`);
        console.log(`Estimated KB: ${(context.length / 1024).toFixed(2)} KB`);
        
        // Count specific sections
        const meatCount = (context.match(/#### RULE: /g) || []).length;
        console.log(`Full Meat Rules Injected: ${meatCount}`);
        
        const skeletonCount = (context.match(/- \*\*/g) || []).length;
        console.log(`Skeleton Rules Injected: ${skeletonCount}`);
    } catch (e) {
        console.error("Error parsing output:", e);
        console.log("Raw stdout:", result.stdout);
        console.log("Raw stderr:", result.stderr);
    }
}

// Cleanup
fs.unlinkSync(mockPayload.transcript_path);
