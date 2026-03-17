import fs from 'fs';
import path from 'path';
import os from 'os';
import { afterToolHook } from '../afterToolHook';
import { LedgerManager } from '../ledger';

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

  test('should detect victory (breakthrough) when success keywords are found', async () => {
    const context = {
      toolName: 'test_tool',
      args: {},
      result: {
        isError: false,
        content: [{ type: 'text', text: 'Breakthrough: This is a Victory!' }],
      },
    };

    await afterToolHook(context);

    expect(mockAddSignal).toHaveBeenCalledWith(expect.objectContaining({
      type: 'breakthrough',
      payload: expect.objectContaining({
        rule: expect.stringContaining('Breakthrough detected'),
      }),
    }));
  });

  test('should detect barrier (error) when result isError is true', async () => {
    const context = {
      toolName: 'test_tool',
      args: {},
      result: {
        isError: true,
        content: [{ type: 'text', text: 'Fatal failure' }],
      },
    };

    await afterToolHook(context);

    expect(mockAddSignal).toHaveBeenCalledWith(expect.objectContaining({
      type: 'barrier',
      payload: expect.objectContaining({
        rule: expect.stringContaining('Barrier encountered'),
      }),
    }));
  });

  test('should not log anything for normal successful results without keywords', async () => {
    const context = {
      toolName: 'test_tool',
      args: {},
      result: {
        isError: false,
        content: [{ type: 'text', text: 'Operation finished normally' }],
      },
    };

    await afterToolHook(context);

    expect(mockAddSignal).not.toHaveBeenCalled();
  });
});
