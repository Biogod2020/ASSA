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
    mockStdoutWrite = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function setupMocks(payload: any, files: Record<string, string> = {}) {
    jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation((fd: any, options?: any) => {
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

  test('should handle semantic interaction audit', async () => {
    const mockPayload = {
      agentName: 'main',
      sessionId: 's1',
      prompt: 'This is a perfect implementation, exactly what I wanted.',
    };
    setupMocks(mockPayload);
    await main();
    const lastCall =
      mockStdoutWrite.mock.calls[mockStdoutWrite.mock.calls.length - 1][0];
    const output = JSON.parse(lastCall as string);
    // If context is too large, it might be truncated.
    const context = output.hookSpecificOutput?.additionalContext || '';
    if (context.includes('CONTEXT SAFETY LIMIT EXCEEDED')) {
      expect(context).toContain('Invoke `distiller`');
    } else {
      expect(context).toContain(
        '### ASSA REFLEX: SEMANTIC INTERACTION AUDIT ###',
      );
    }
  });

  test('should detect victory breakthrough analysis', async () => {
    const mockPayload = {
      agentName: 'main',
      sessionId: 's1',
      transcript_path: 'fake_transcript.json',
    };
    const transcript = [
      { type: 'agent', toolCalls: [{ status: 'error', result: 'failed' }] },
      { type: 'agent', toolCalls: [{ status: 'success', result: 'Victory!' }] },
    ];
    setupMocks(mockPayload, {
      'fake_transcript.json': JSON.stringify({ messages: transcript }),
    });
    await main();
    const lastCall =
      mockStdoutWrite.mock.calls[mockStdoutWrite.mock.calls.length - 1][0];
    const output = JSON.parse(lastCall as string);
    const context = output.hookSpecificOutput?.additionalContext || '';
    if (context.includes('CONTEXT SAFETY LIMIT EXCEEDED')) {
      expect(context).toContain('Invoke `distiller`');
    } else {
      expect(context).toContain(
        '### ASSA REFLEX: BREAKTHROUGH ANALYSIS ###',
      );
    }
  });

  test('should detect barrier identification', async () => {
    const mockPayload = {
      agentName: 'main',
      sessionId: 's1',
      transcript_path: 'fake_transcript.json',
    };
    const transcript = [
      { type: 'agent', toolCalls: [{ status: 'error', result: 'fail 1' }] },
      { type: 'agent', toolCalls: [{ status: 'error', result: 'fail 2' }] },
      { type: 'agent', toolCalls: [{ status: 'error', result: 'fail 3' }] },
    ];
    setupMocks(mockPayload, {
      'fake_transcript.json': JSON.stringify({ messages: transcript }),
    });
    await main();
    const lastCall =
      mockStdoutWrite.mock.calls[mockStdoutWrite.mock.calls.length - 1][0];
    const output = JSON.parse(lastCall as string);
    const context = output.hookSpecificOutput?.additionalContext || '';
    if (context.includes('CONTEXT SAFETY LIMIT EXCEEDED')) {
      expect(context).toContain('Invoke `distiller`');
    } else {
      expect(context).toContain(
        '### ASSA REFLEX: BARRIER IDENTIFICATION ###',
      );
    }
  });

  test('should handle health warnings and sensitivity', async () => {
    const mockPayload = {
      agentName: 'main',
      sessionId: 's1',
      prompt: '很好!',
    };
    const settingsPath = path.join(os.homedir(), '.gemini/settings.json');
    setupMocks(mockPayload, {
      [settingsPath]: JSON.stringify({ experimental: { enableAgents: false } }),
    });
    await main();
    const lastCall =
      mockStdoutWrite.mock.calls[mockStdoutWrite.mock.calls.length - 1][0];
    const output = JSON.parse(lastCall as string);
    const context = output.hookSpecificOutput?.additionalContext || '';
    if (context.includes('CONTEXT SAFETY LIMIT EXCEEDED')) {
      expect(context).toContain('Invoke `distiller`');
    } else {
      expect(context).toContain(
        '### ASSA HEALTH WARNING ###',
      );
      expect(context).toContain(
        '### ASSA REFLEX: SEMANTIC INTERACTION AUDIT ###',
      );
    }
  });
});
