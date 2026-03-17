import fs from 'fs';
import path from 'path';
import os from 'os';
import { LedgerManager } from '../ledger';

describe('LedgerManager', () => {
  let tempDir: string;
  let ledgerManager: LedgerManager;
  let patternsPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-test-'));
    ledgerManager = new LedgerManager(tempDir);
    patternsPath = path.join(tempDir, '.memory', 'patterns.md');
    // Ensure .memory dir exists
    fs.mkdirSync(path.join(tempDir, '.memory'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('should add a signal to the ledger', () => {
    const signal = {
      session_id: 'test-session',
      message_id: 'msg-1',
      type: 'positive' as const,
      payload: {
        rule: 'Always use TDD',
        context: 'User requested testing',
        tags: ['tdd', 'test'],
      },
    };

    const record = ledgerManager.addSignal(signal);

    expect(record.message_id).toBe('msg-1');
    expect(record.status).toBe('PENDING');
    expect(record.timestamp).toBeDefined();

    const pending = ledgerManager.getPending();
    expect(pending.length).toBe(1);
    expect(pending[0].payload.rule).toBe('Always use TDD');
  });

  test('should mark signals as processed', () => {
    ledgerManager.addSignal({
      session_id: 's1',
      message_id: 'm1',
      type: 'positive',
      payload: { rule: 'R1', context: 'C1', tags: [] },
    });

    ledgerManager.markProcessed(['m1']);

    const pending = ledgerManager.getPending();
    expect(pending.length).toBe(0);
  });

  test('should distill pending signals into patterns.md', () => {
    ledgerManager.addSignal({
      session_id: 's1',
      message_id: 'm1',
      type: 'positive',
      payload: { rule: 'Rule 1', context: 'C1', tags: ['arch'] },
    });

    const result = ledgerManager.distillPending(patternsPath);

    expect(result).toContain('Distilled 1 signals');
    expect(result).toContain('Rule 1');

    const content = fs.readFileSync(patternsPath, 'utf8');
    expect(content).toContain('- **arch**: Rule 1 (from m1)');

    const pending = ledgerManager.getPending();
    expect(pending.length).toBe(0);
  });
});
