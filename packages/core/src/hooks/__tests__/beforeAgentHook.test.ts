import fs from 'fs';
import path from 'path';
import os from 'os';
import { main } from '../beforeAgentHook';
import { BeforeAgentInput } from '../hookTypes';

describe('beforeAgentHook', () => {
  let tempDir: string;
  let mockStdoutWrite: jest.SpyInstance;
  const originalReadFileSync = fs.readFileSync;
  const originalExistsSync = fs.existsSync;

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

  function setupMocks(payload: BeforeAgentInput) {
    jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation((fd: any, options?: any) => {
        if (fd === 0) return JSON.stringify(payload);
        try {
          return originalReadFileSync(fd, options);
        } catch (e) {
          return '';
        }
      });
    jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
      const filePath = String(p);
      if (filePath.includes('.memory')) return true;
      if (filePath.includes('.gemini/assa')) return true;
      return originalExistsSync(p);
    });
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
  }

  const baseInput: BeforeAgentInput = {
    session_id: 's1',
    transcript_path: 't1',
    cwd: '/tmp', // This will be used by our mock
    hook_event_name: 'BeforeAgent',
    timestamp: new Date().toISOString(),
    prompt: 'Hello',
  };

  test('should handle semantic interaction audit', async () => {
    const input: BeforeAgentInput = {
      ...baseInput,
      cwd: tempDir,
      prompt: 'This is a perfect implementation, exactly what I wanted.',
    };
    setupMocks(input);
    await main();
    
    expect(mockStdoutWrite).toHaveBeenCalled();
    const lastCall = mockStdoutWrite.mock.calls[mockStdoutWrite.mock.calls.length - 1][0];
    const output = JSON.parse(lastCall as string);
    expect(output.hookSpecificOutput?.additionalContext).toContain(
      '### ASSA REFLEX: SEMANTIC INTERACTION AUDIT ###',
    );
  });

  test('should handle health warnings and sensitivity', async () => {
    const input: BeforeAgentInput = {
      ...baseInput,
      cwd: tempDir,
      prompt: '很好!',
    };
    setupMocks(input);
    
    await main();
    expect(mockStdoutWrite).toHaveBeenCalled();
    const lastCall = mockStdoutWrite.mock.calls[mockStdoutWrite.mock.calls.length - 1][0];
    const output = JSON.parse(lastCall as string);
    expect(output.hookSpecificOutput?.additionalContext).toContain(
      '### ASSA REFLEX: SEMANTIC INTERACTION AUDIT ###',
    );
  });
});
