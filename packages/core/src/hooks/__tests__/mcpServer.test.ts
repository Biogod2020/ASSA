import { AssaMcpServer } from '../mcpServer';
import { LedgerManager } from '../ledger';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../ledger');

describe('AssaMcpServer', () => {
  let mockServer: any;
  let mockLedgerManager: any;
  let setRequestHandlerSpy: jest.Mock;

  beforeEach(() => {
    setRequestHandlerSpy = jest.fn();
    mockServer = {
      setRequestHandler: setRequestHandlerSpy,
      connect: jest.fn(),
    };
    (Server as jest.Mock).mockImplementation(() => mockServer);

    mockLedgerManager = {
      addSignal: jest.fn(),
      distillPending: jest.fn(),
      markProcessed: jest.fn(),
    };
    (LedgerManager as jest.Mock).mockImplementation(() => mockLedgerManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should register tool handlers upon initialization', () => {
    new AssaMcpServer();

    // Verify that setRequestHandler was called twice (once for ListTools, once for CallTool)
    expect(setRequestHandlerSpy).toHaveBeenCalledTimes(2);
  });

  test('should call ledgerManager.addSignal when submit_memory_signal is called', async () => {
    const server = new AssaMcpServer();

    // ListTools is usually index 0, CallTool index 1
    const callToolHandler = setRequestHandlerSpy.mock.calls[1][1];

    mockLedgerManager.addSignal.mockReturnValue({ message_id: 'm1' });

    const result = await callToolHandler({
      params: {
        name: 'submit_memory_signal',
        arguments: { rule: 'Test Rule', session_id: 's1' },
      },
    });

    expect(mockLedgerManager.addSignal).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 's1',
        payload: expect.objectContaining({ rule: 'Test Rule' }),
      }),
    );
    expect(result.content[0].text).toContain('Signal appended');
  });

  test('should call ledgerManager.distillPending when distill_pending is called', async () => {
    const server = new AssaMcpServer();
    const callToolHandler = setRequestHandlerSpy.mock.calls[1][1];
    mockLedgerManager.distillPending.mockReturnValue('Distilled signals');

    const result = await callToolHandler({
      params: {
        name: 'distill_pending',
        arguments: {},
      },
    });

    expect(mockLedgerManager.distillPending).toHaveBeenCalled();
    expect(result.content[0].text).toBe('Distilled signals');
  });

  test('should call ledgerManager.markProcessed when mark_processed_signals is called', async () => {
    const server = new AssaMcpServer();
    const callToolHandler = setRequestHandlerSpy.mock.calls[1][1];

    const result = await callToolHandler({
      params: {
        name: 'mark_processed_signals',
        arguments: { message_ids: ['m1', 'm2'] },
      },
    });

    expect(mockLedgerManager.markProcessed).toHaveBeenCalledWith(['m1', 'm2']);
    expect(result.content[0].text).toContain('Marked 2 signals');
  });

  test('should return success text for request_global_promotion', async () => {
    const server = new AssaMcpServer();
    const callToolHandler = setRequestHandlerSpy.mock.calls[1][1];

    const result = await callToolHandler({
      params: {
        name: 'request_global_promotion',
        arguments: { topic: 'ARCHITECTURE' },
      },
    });

    expect(result.content[0].text).toContain('GLOBAL PROMOTION REQUESTED');
    expect(result.content[0].text).toContain('ARCHITECTURE');
  });

  test('should return error when tool is not found', async () => {
    const server = new AssaMcpServer();
    const callToolHandler = setRequestHandlerSpy.mock.calls[1][1];

    const result = await callToolHandler({
      params: {
        name: 'non_existent_tool',
        arguments: {},
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: Tool not found');
  });
});
