import fs from 'fs';
import path from 'path';
import os from 'os';
import { afterToolHook } from '../afterToolHook';
import { LedgerManager } from '../ledger';
import { AfterToolInput } from '../hookTypes';

jest.mock('../ledger');

describe('afterToolHook (Smart Reflex)', () => {
  let tempDir: string;
  let mockAddSignal: jest.Mock;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-test-'));
    jest.spyOn(process, 'cwd').mockReturnValue(tempDir);

    mockAddSignal = jest.fn();
    (LedgerManager as jest.Mock).mockImplementation(() => ({
      addSignal: mockAddSignal,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const baseInput: AfterToolInput = {
    session_id: 's1',
    transcript_path: 't1',
    cwd: process.cwd(),
    hook_event_name: 'AfterTool',
    timestamp: new Date().toISOString(),
    tool_name: 'test_tool',
    tool_input: {},
    tool_response: {},
  };

  test('should detect victory (breakthrough) when success keywords are found', async () => {
    const input: AfterToolInput = {
      ...baseInput,
      tool_response: { output: 'Breakthrough: This is a Victory!' },
    };

    await afterToolHook(input);

    expect(mockAddSignal).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'breakthrough',
        payload: expect.objectContaining({
          rule: expect.stringContaining('Potential Breakthrough'),
        }),
      }),
    );
  });

  test('should detect git commit trigger', async () => {
    const input: AfterToolInput = {
      ...baseInput,
      tool_name: 'run_shell_command',
      tool_input: { command: 'git commit -m "feat: test"' },
      tool_response: { output: '[master 123456] feat: test' },
    };

    const output = await afterToolHook(input);

    expect(output.hookSpecificOutput?.additionalContext).toContain(
      'GIT COMMIT DETECTED',
    );
  });

  test('should detect barrier (error) when response contains failure markers', async () => {
    const input: AfterToolInput = {
      ...baseInput,
      tool_response: { error: 'Exit Code: 1', stderr: 'Fatal failure' },
    };

    await afterToolHook(input);

    expect(mockAddSignal).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'barrier',
        payload: expect.objectContaining({
          rule: expect.stringContaining('Barrier encountered'),
        }),
      }),
    );
  });
});
