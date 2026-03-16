const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const HOOK_PATH = path.join(__dirname, '../../hooks/afterToolHook.js');

function runHook(payload) {
    const input = JSON.stringify(payload);
    const result = spawnSync('node', [HOOK_PATH], {
        input: input,
        encoding: 'utf8'
    });
    return result;
}

const payloads = [
    {
        tool_name: 'run_shell_command',
        tool_input: { command: 'ls' },
        tool_response: { llmContent: 'Exit Code: 0', status: 'success' }
    },
    {
        tool_name: 'mcp_assa-mcp_submit_memory_signal',
        tool_input: { rule: 'test' },
        tool_response: { llmContent: 'Signal appended', status: 'success' }
    },
    {
        tool_name: 'mcp_assa-mcp_submit_memory_signal',
        tool_input: { rule: 'test' },
        tool_response: { status: 'success' } // Missing llmContent
    }
];

payloads.forEach((payload, index) => {
    console.log(`Test Case ${index + 1}: ${payload.tool_name}`);
    const result = runHook(payload);
    if (result.status !== 0) {
        console.error(`FAILED: Exit Code ${result.status}`);
        console.error(`Stderr: ${result.stderr}`);
    } else {
        console.log(`SUCCESS: ${result.stdout.trim()}`);
    }
    console.log('---');
});
