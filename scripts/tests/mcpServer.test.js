const assert = require('assert');
const { execSync } = require('child_process');

function runTest() {
    console.log("Running mcpServer MCP tool schema tests...");
    
    // Simulate sending a tools/list request to the server
    const request = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {}
    });

    const output = execSync(`echo '${request}' | node hooks/mcpServer.js`, { encoding: 'utf8' });
    
    // Output often has multiple lines of logging. Let's find the valid JSON response.
    const lines = output.split('\n');
    let responseObj = null;
    for (const line of lines) {
        if (line.trim().startsWith('{') && line.includes('"result"')) {
            try {
                responseObj = JSON.parse(line);
                break;
            } catch (e) {}
        }
    }

    assert(responseObj, "Failed to parse JSON response from server");
    assert(responseObj.result && responseObj.result.tools, "Response missing tools array");
    
    const submitTool = responseObj.result.tools.find(t => t.name === 'submit_memory_signal');
    assert(submitTool, "submit_memory_signal tool not found");
    
    const props = submitTool.inputSchema.properties;
    
    // Verify the new 4-part structure exists
    assert(props.raw_symptom, "Missing raw_symptom property");
    assert(props.failed_attempts, "Missing failed_attempts property");
    assert(props.breakthrough, "Missing breakthrough property");
    assert(props.rule, "Missing rule property");
    
    // Check required fields
    const required = submitTool.inputSchema.required;
    assert(required.includes('raw_symptom'), "raw_symptom should be required");
    assert(required.includes('breakthrough'), "breakthrough should be required");
    assert(required.includes('rule'), "rule should be required");

    console.log("✅ MCP Schema updated correctly!");
}

try {
    runTest();
} catch (e) {
    console.error("❌ Test Failed:", e.message);
    process.exit(1);
}
