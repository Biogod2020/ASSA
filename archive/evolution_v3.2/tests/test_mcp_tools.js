#!/usr/bin/env node
/**
 * Direct MCP Tool Validation — Zero LLM calls, Zero quota consumption.
 * Tests all 4 MCP tools by sending JSON-RPC messages directly to the MCP server.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SANDBOX_DIR = '/Users/jay/assa-sandbox';
const MCP_SERVER = path.join(__dirname, '..', 'hooks', 'mcpServer.js');
const GLOBAL_LIB_DIR = path.join(require('os').homedir(), '.gemini', 'assa', 'LIBRARY');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
    if (condition) {
        console.log(`  ✓ ${msg}`);
        passed++;
    } else {
        console.log(`  ✗ ${msg}`);
        failed++;
    }
}

async function sendRpc(proc, method, params, id) {
    return new Promise((resolve) => {
        const request = JSON.stringify({ jsonrpc: '2.0', method, params, id }) + '\n';
        let buffer = '';

        const onData = (chunk) => {
            buffer += chunk.toString();
            // Try to parse each line
            const lines = buffer.split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const response = JSON.parse(line);
                    if (response.id === id) {
                        proc.stdout.removeListener('data', onData);
                        resolve(response);
                        return;
                    }
                } catch (e) { /* partial line, keep buffering */ }
            }
        };

        proc.stdout.on('data', onData);
        proc.stdin.write(request);

        // Timeout after 5s
        setTimeout(() => {
            proc.stdout.removeListener('data', onData);
            resolve({ error: 'timeout' });
        }, 5000);
    });
}

async function main() {
    console.log('=== ASSA V3.2 Direct MCP Tool Validation ===\n');
    console.log('No LLM calls. No quota. Pure function testing.\n');

    // Setup sandbox
    console.log('--- Setup ---');
    if (fs.existsSync(SANDBOX_DIR)) {
        fs.rmSync(SANDBOX_DIR, { recursive: true });
    }
    fs.mkdirSync(path.join(SANDBOX_DIR, '.memory'), { recursive: true });
    fs.writeFileSync(path.join(SANDBOX_DIR, '.memory', 'evolution_ledger.json'), '[]');
    fs.writeFileSync(path.join(SANDBOX_DIR, '.memory', 'patterns.md'), '# PATTERNS\n');
    console.log('  Sandbox created at', SANDBOX_DIR);

    // Start MCP server
    const mcp = spawn('node', [MCP_SERVER], {
        cwd: SANDBOX_DIR,
        stdio: ['pipe', 'pipe', 'pipe']
    });

    mcp.stderr.on('data', (d) => { /* suppress stderr */ });

    // Initialize
    const initResp = await sendRpc(mcp, 'initialize', {
        protocolVersion: '2025-11-25',
        capabilities: { roots: { listChanged: true } },
        clientInfo: { name: 'test-client', version: '1.0.0' }
    }, 0);
    assert(initResp.result && initResp.result.serverInfo.name === 'assa-mcp', 'MCP server initialized (v2.0.0)');

    // Notify initialized (no response expected)
    mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    await new Promise(r => setTimeout(r, 100));

    // Test 1: tools/list
    console.log('\n--- Test 1: tools/list ---');
    const listResp = await sendRpc(mcp, 'tools/list', {}, 1);
    const tools = listResp.result.tools.map(t => t.name);
    assert(tools.includes('submit_memory_signal'), 'submit_memory_signal tool available');
    assert(tools.includes('distill_pending'), 'distill_pending tool available');
    assert(tools.includes('request_global_promotion'), 'request_global_promotion tool available');
    assert(tools.includes('mark_processed_signals'), 'mark_processed_signals tool available');

    // Test 2: submit_memory_signal
    console.log('\n--- Test 2: submit_memory_signal ---');
    const submitResp = await sendRpc(mcp, 'tools/call', {
        name: 'submit_memory_signal',
        arguments: {
            type: 'positive',
            rule: "Use 'const' for all immutable variables in JavaScript.",
            context: 'User preference',
            tags: ['javascript', 'style']
        }
    }, 2);
    assert(submitResp.result.content[0].text.includes('PENDING'), 'Signal appended as PENDING');

    // Verify ledger
    const ledger = JSON.parse(fs.readFileSync(path.join(SANDBOX_DIR, '.memory', 'evolution_ledger.json'), 'utf8'));
    assert(ledger.length === 1, 'Ledger has 1 entry');
    assert(ledger[0].status === 'PENDING', 'Entry status is PENDING');
    assert(ledger[0].payload.rule.includes('const'), 'Entry contains const rule');

    // Test 3: distill_pending (pure function!)
    console.log('\n--- Test 3: distill_pending ---');
    const START = Date.now();
    const distillResp = await sendRpc(mcp, 'tools/call', {
        name: 'distill_pending',
        arguments: {}
    }, 3);
    const DURATION = Date.now() - START;
    assert(distillResp.result.content[0].text.includes('Distilled 1 signals'), 'Distilled 1 signal');
    assert(DURATION < 100, `Execution time: ${DURATION}ms (< 100ms)`);

    // Verify patterns.md
    const patterns = fs.readFileSync(path.join(SANDBOX_DIR, '.memory', 'patterns.md'), 'utf8');
    assert(patterns.includes('const'), 'patterns.md contains const rule');

    // Verify ledger status changed
    const ledger2 = JSON.parse(fs.readFileSync(path.join(SANDBOX_DIR, '.memory', 'evolution_ledger.json'), 'utf8'));
    assert(ledger2[0].status === 'PROCESSED', 'Ledger entry marked PROCESSED');

    // Test 4: distill_pending with no pending items
    console.log('\n--- Test 4: distill_pending (no pending) ---');
    const distillResp2 = await sendRpc(mcp, 'tools/call', {
        name: 'distill_pending',
        arguments: {}
    }, 4);
    assert(distillResp2.result.content[0].text.includes('No pending'), 'Returns "No pending signals" when empty');

    // Test 5: request_global_promotion (pure function!)
    console.log('\n--- Test 5: request_global_promotion ---');
    const START2 = Date.now();
    const promoResp = await sendRpc(mcp, 'tools/call', {
        name: 'request_global_promotion',
        arguments: { topic: 'all' }
    }, 5);
    const DURATION2 = Date.now() - START2;
    assert(promoResp.result.content[0].text.includes('Promoted'), 'Promotion executed');
    assert(DURATION2 < 100, `Execution time: ${DURATION2}ms (< 100ms)`);

    // Verify global library
    const globalFile = path.join(GLOBAL_LIB_DIR, 'PROMOTED_PATTERNS.md');
    assert(fs.existsSync(globalFile), 'PROMOTED_PATTERNS.md created in L3 LIBRARY');
    if (fs.existsSync(globalFile)) {
        const content = fs.readFileSync(globalFile, 'utf8');
        assert(content.includes('const'), 'Global patterns contain const rule');
    }

    // Test 6: mark_processed_signals
    console.log('\n--- Test 6: mark_processed_signals ---');
    // First add a new signal
    await sendRpc(mcp, 'tools/call', {
        name: 'submit_memory_signal',
        arguments: { rule: 'Test rule', type: 'positive', tags: ['test'] }
    }, 60);
    const ledger3 = JSON.parse(fs.readFileSync(path.join(SANDBOX_DIR, '.memory', 'evolution_ledger.json'), 'utf8'));
    const newId = ledger3[ledger3.length - 1].message_id;
    
    const markResp = await sendRpc(mcp, 'tools/call', {
        name: 'mark_processed_signals',
        arguments: { message_ids: [newId] }
    }, 6);
    assert(markResp.result.content[0].text.includes('Marked 1'), 'Marked 1 signal as PROCESSED');

    // Cleanup
    mcp.kill();

    // Summary
    console.log('\n===================================');
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('===================================');

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
