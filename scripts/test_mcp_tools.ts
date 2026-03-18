import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Direct MCP Tool Validation for TS version.
 * Zero LLM calls, Zero quota consumption.
 */

const PROJECT_ROOT = process.cwd();
const SANDBOX_DIR = '/tmp/assa-mcp-atomic-sandbox';
const MCP_SERVER = path.join(PROJECT_ROOT, 'dist', 'mcpServer.js');
const GLOBAL_LIB_DIR = path.join(os.homedir(), '.gemini', 'assa', 'LIBRARY');

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.log(`  ✗ ${msg}`);
    failed++;
  }
}

async function sendRpc(proc: ChildProcess, method: string, params: any, id: number): Promise<any> {
  return new Promise((resolve) => {
    const request = JSON.stringify({ jsonrpc: '2.0', method, params, id }) + '\n';
    let buffer = '';

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const response = JSON.parse(line);
          if (response.id === id) {
            proc.stdout?.removeListener('data', onData);
            resolve(response);
            return;
          }
        } catch (e) {}
      }
    };

    proc.stdout?.on('data', onData);
    proc.stdin?.write(request);

    setTimeout(() => {
      proc.stdout?.removeListener('data', onData);
      resolve({ error: 'timeout' });
    }, 10000);
  });
}

async function main() {
  console.log('=== ASSA V3.2 Direct MCP Tool Validation (Atomic) ===\n');

  if (!fs.existsSync(MCP_SERVER)) {
    console.error(`Error: MCP Server not found at ${MCP_SERVER}. Run npm run build first.`);
    process.exit(1);
  }

  // Setup sandbox
  if (fs.existsSync(SANDBOX_DIR)) {
    fs.rmSync(SANDBOX_DIR, { recursive: true });
  }
  fs.mkdirSync(path.join(SANDBOX_DIR, '.memory'), { recursive: true });
  fs.writeFileSync(path.join(SANDBOX_DIR, '.memory', 'evolution_ledger.json'), '[]');
  fs.writeFileSync(path.join(SANDBOX_DIR, '.memory', 'patterns.md'), '# PATTERNS\n');

  // Start MCP server
  const mcp = spawn('node', [MCP_SERVER], {
    cwd: SANDBOX_DIR,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  mcp.stderr?.on('data', (d) => {
    // console.error(`[MCP Debug] ${d.toString()}`);
  });

  // Initialize
  console.log('--- Initializing ---');
  const initResp = await sendRpc(mcp, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' },
  }, 0);
  assert(initResp.result && initResp.result.serverInfo.name === 'assa-mcp', 'MCP server initialized');

  // Test 1: list tools
  console.log('\n--- Test 1: List Tools ---');
  const listResp = await sendRpc(mcp, 'tools/list', {}, 1);
  const tools = listResp.result.tools.map((t: any) => t.name);
  assert(tools.includes('submit_memory_signal'), 'submit_memory_signal tool available');
  assert(tools.includes('distill_pending'), 'distill_pending tool available');

  // Test 2: submit signal
  console.log('\n--- Test 2: Submit Signal ---');
  const submitResp = await sendRpc(mcp, 'tools/call', {
    name: 'submit_memory_signal',
    arguments: {
      type: 'positive',
      rule: 'TS Atomic Testing is Fast',
      context: 'Direct RPC test',
      tags: ['test', 'performance'],
    },
  }, 2);
  assert(submitResp.result.content[0].text.includes('PENDING'), 'Signal recorded as PENDING');

  // Verify file
  const ledger = JSON.parse(fs.readFileSync(path.join(SANDBOX_DIR, '.memory', 'evolution_ledger.json'), 'utf8'));
  assert(ledger.length === 1 && ledger[0].payload.rule === 'TS Atomic Testing is Fast', 'Ledger verified');

  // Test 3: Distill
  console.log('\n--- Test 3: Distill Pending ---');
  await sendRpc(mcp, 'tools/call', {
    name: 'distill_pending',
    arguments: {},
  }, 3);
  const patterns = fs.readFileSync(path.join(SANDBOX_DIR, '.memory', 'patterns.md'), 'utf8');
  assert(patterns.includes('TS Atomic Testing is Fast'), 'Patterns.md updated');

  mcp.kill();
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
