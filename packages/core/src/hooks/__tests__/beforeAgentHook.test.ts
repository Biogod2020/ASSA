import fs from 'fs';
import path from 'path';
import os from 'os';
import { main } from '../beforeAgentHook';

describe('beforeAgentHook', () => {
  let tempDir: string;
  let mockStdoutWrite: jest.SpyInstance;
  const originalExistsSync = fs.existsSync;
  const originalReadFileSync = fs.readFileSync;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-test-'));
    jest.spyOn(process, 'cwd').mockReturnValue(tempDir);
    mockStdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function setupMocks(payload: any, files: Record<string, string> = {}) {
    jest.spyOn(fs, 'readFileSync').mockImplementation((fd: any, options?: any) => {
      if (fd === 0) return JSON.stringify(payload);
      const filePath = String(fd);
      for (const [mockPath, content] of Object.entries(files)) {
        if (filePath === mockPath || filePath.endsWith(mockPath)) {
          return content;
        }
      }
      if (filePath.includes('evolution_ledger.json')) return '[]';
      try {
        return originalReadFileSync(fd, options);
      } catch (e) {
        return '';
      }
    });
    jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
      const filePath = String(p);
      for (const mockPath of Object.keys(files)) {
        if (filePath === mockPath || filePath.endsWith(mockPath)) {
          return true;
        }
      }
      if (filePath.includes('.memory')) return true;
      if (filePath.includes('.gemini/assa')) return true;
      return originalExistsSync(p);
    });
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
    jest.spyOn(fs, 'copyFileSync').mockImplementation(() => undefined);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
  }

  test('should initialize local setup if .memory is missing', async () => {
    const mockPayload = { agentName: 'main', sessionId: 's1', prompt: 'Hello' };
    setupMocks(mockPayload);
    await main();
    expect(fs.existsSync(path.join(tempDir, '.memory'))).toBe(true);
    expect(mockStdoutWrite).toHaveBeenCalled();
  });

  test('should bypass logic for distiller agent', async () => {
    const mockPayload = { agentName: 'distiller', sessionId: 's1' };
    setupMocks(mockPayload);
    await main();
    const lastCall = mockStdoutWrite.mock.calls[mockStdoutWrite.mock.calls.length - 1][0];
    const output = JSON.parse(lastCall as string);
    expect(output.decision).toBe('allow');
  });

  test('should handle health warnings and transcript praise', async () => {
    const mockPayload = {
      agentName: 'main',
      sessionId: 's1',
      transcript_path: 'fake_transcript.json'
    };
    const transcript = [{ type: 'user', content: '太棒了!' }];
    const settingsPath = path.join(os.homedir(), '.gemini/settings.json');
    setupMocks(mockPayload, {
      'fake_transcript.json': JSON.stringify({ messages: transcript }),
      [settingsPath]: JSON.stringify({ experimental: { enableAgents: false } })
    });
    await main();
    const lastCall = mockStdoutWrite.mock.calls[mockStdoutWrite.mock.calls.length - 1][0];
    const output = JSON.parse(lastCall as string);
    expect(output.hookSpecificOutput?.additionalContext).toContain('### ASSA HEALTH WARNING ###');
    expect(output.hookSpecificOutput?.additionalContext).toContain('### ASSA REFLEX: PRAISE DETECTED ###');
  });

  test('should detect victory reflex from transcript', async () => {
    const mockPayload = {
      agentName: 'main',
      sessionId: 's1',
      transcript_path: 'fake_transcript.json'
    };
    const transcript = [
      { type: 'agent', toolCalls: [{ status: 'error', result: 'failed' }] },
      { type: 'agent', toolCalls: [{ status: 'success', result: 'Victory!' }] }
    ];
    setupMocks(mockPayload, {
      'fake_transcript.json': JSON.stringify({ messages: transcript })
    });
    await main();
    const lastCall = mockStdoutWrite.mock.calls[mockStdoutWrite.mock.calls.length - 1][0];
    const output = JSON.parse(lastCall as string);
    expect(output.hookSpecificOutput?.additionalContext).toContain('### ASSA REFLEX: VICTORY DETECTED ###');
  });

  test('should detect barrier reflex', async () => {
    const mockPayload = {
      agentName: 'main',
      sessionId: 's1',
      transcript_path: 'fake_transcript.json'
    };
    const transcript = [
      { type: 'agent', toolCalls: [{ status: 'error', result: 'fail 1' }] },
      { type: 'agent', toolCalls: [{ status: 'error', result: 'fail 2' }] },
      { type: 'agent', toolCalls: [{ status: 'error', result: 'fail 3' }] }
    ];
    setupMocks(mockPayload, {
      'fake_transcript.json': JSON.stringify({ messages: transcript })
    });
    await main();
    const lastCall = mockStdoutWrite.mock.calls[mockStdoutWrite.mock.calls.length - 1][0];
    const output = JSON.parse(lastCall as string);
    expect(output.hookSpecificOutput?.additionalContext).toContain('### ASSA REFLEX: BARRIER DETECTED ###');
  });

  test('should inject pending signals from ledger', async () => {
    const mockPayload = { agentName: 'main', sessionId: 's1' };
    const ledger = [
      { status: 'PENDING', payload: { rule: 'Rule 1', tags: [] }, message_id: 'm1' }
    ];
    setupMocks(mockPayload, {
      '.memory/evolution_ledger.json': JSON.stringify(ledger)
    });
    await main();
    const lastCall = mockStdoutWrite.mock.calls[mockStdoutWrite.mock.calls.length - 1][0];
    const output = JSON.parse(lastCall as string);
    expect(output.hookSpecificOutput?.additionalContext).toContain('Rule 1');
  });

  test('should handle complex transcript results', async () => {
    const mockPayload = {
      agentName: 'main',
      sessionId: 's1',
      transcript_path: 'complex.json'
    };
    const transcript = [
      { 
        type: 'agent', 
        toolCalls: [{ 
          status: 'success', 
          result: [{ functionResponse: { response: { output: 'Victory' } } }]
        }] 
      }
    ];
    setupMocks(mockPayload, {
      'complex.json': JSON.stringify({ messages: transcript })
    });
    await main();
    expect(mockStdoutWrite).toHaveBeenCalled();
  });

  test('should handle context safety limit', async () => {
    const mockPayload = { agentName: 'main', sessionId: 's1' };
    setupMocks(mockPayload, {
      '.memory/patterns.md': 'A'.repeat(21000)
    });
    await main();
    const lastCall = mockStdoutWrite.mock.calls[mockStdoutWrite.mock.calls.length - 1][0];
    const output = JSON.parse(lastCall as string);
    expect(output.hookSpecificOutput?.additionalContext).toContain('CONTEXT SAFETY LIMIT EXCEEDED');
  });

  test('should handle L3 and domain-aware loading', async () => {
    const mockPayload = { agentName: 'main', sessionId: 's1', extensionPath: tempDir };
    const indexJson = JSON.stringify({ mappings: [{ domains: ['hook-test'], pattern: 'DOMAIN_RULES.md' }] });
    setupMocks(mockPayload, {
      'index.json': indexJson,
      'DOMAIN_RULES.md': '# Domain Specific Rules'
    });
    await main();
    const lastCall = mockStdoutWrite.mock.calls[mockStdoutWrite.mock.calls.length - 1][0];
    const output = JSON.parse(lastCall as string);
    expect(output.hookSpecificOutput?.additionalContext).toContain('# Domain Specific Rules');
  });
});
