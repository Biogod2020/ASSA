import fs from 'fs';
import path from 'path';
import { SignalRecord } from './types';

export class LedgerManager {
  private ledgerPath: string;
  private lockPath: string;

  constructor(workspaceRoot: string) {
    this.ledgerPath = path.join(workspaceRoot, '.memory', 'evolution_ledger.json');
    this.lockPath = path.join(workspaceRoot, '.memory', 'evolution_ledger.json.lock');
  }

  private ensureMemoryDir(): void {
    const dir = path.dirname(this.ledgerPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Atomic file lock using mkdirSync with retries
   */
  private withLock<T>(callback: () => T): T {
    this.ensureMemoryDir();
    const maxRetries = 50;
    let lockAcquired = false;

    for (let i = 0; i < maxRetries; i++) {
      try {
        fs.mkdirSync(this.lockPath);
        lockAcquired = true;
        break;
      } catch (err: any) {
        if (err.code === 'EEXIST') {
          // Blocking wait with small random delay
          const retryDelay = Math.floor(Math.random() * 50) + 10;
          const start = Date.now();
          while (Date.now() - start < retryDelay) {
            /* block */
          }
          continue;
        }
        throw err;
      }
    }

    if (!lockAcquired) {
      throw new Error('Could not acquire ledger lock after max retries.');
    }

    try {
      return callback();
    } finally {
      try {
        fs.rmdirSync(this.lockPath);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }

  private readLedger(): SignalRecord[] {
    if (!fs.existsSync(this.ledgerPath)) {
      return [];
    }
    try {
      const data = fs.readFileSync(this.ledgerPath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error('Error reading ledger:', err);
      return [];
    }
  }

  private writeLedger(ledger: SignalRecord[]): void {
    this.ensureMemoryDir();
    fs.writeFileSync(this.ledgerPath, JSON.stringify(ledger, null, 2), 'utf8');
  }

  public addSignal(
    signal: Omit<SignalRecord, 'timestamp' | 'status' | 'git_anchor'>
  ): SignalRecord {
    return this.withLock(() => {
      const ledger = this.readLedger();
      const record: SignalRecord = {
        ...signal,
        timestamp: new Date().toISOString(),
        status: 'PENDING',
        git_anchor: '',
      };
      ledger.push(record);
      this.writeLedger(ledger);
      return record;
    });
  }

  public getPending(): SignalRecord[] {
    return this.readLedger().filter((s) => s.status === 'PENDING');
  }

  public markProcessed(messageIds: string[]): void {
    this.withLock(() => {
      const ledger = this.readLedger();
      ledger.forEach((s) => {
        if (messageIds.includes(s.message_id)) {
          s.status = 'PROCESSED';
        }
      });
      this.writeLedger(ledger);
    });
  }

  /**
   * Batch update status based on a filter function
   */
  public updateStatus(
    updateFn: (ledger: SignalRecord[]) => void
  ): void {
    this.withLock(() => {
      const ledger = this.readLedger();
      updateFn(ledger);
      this.writeLedger(ledger);
    });
  }

  public distillPending(patternsPath: string): string {
    return this.withLock(() => {
      const ledger = this.readLedger();
      const pending = ledger.filter((s) => s.status === 'PENDING');

      if (pending.length === 0) {
        return 'No pending signals to distill.';
      }

      let patternsContent = '# PATTERNS\n';
      if (fs.existsSync(patternsPath)) {
        patternsContent = fs.readFileSync(patternsPath, 'utf8');
      }

      const newEntries = pending.map((s) => {
        const tags =
          s.payload.tags.length > 0 ? s.payload.tags.join('/') : 'general';
        return `- **${tags}**: ${s.payload.rule} (from ${s.message_id})`;
      });

      patternsContent =
        patternsContent.trimEnd() + '\n' + newEntries.join('\n') + '\n';
      fs.writeFileSync(patternsPath, patternsContent, 'utf8');

      // Mark as processed
      pending.forEach((s) => {
        s.status = 'PROCESSED';
      });
      this.writeLedger(ledger);

      return `Distilled ${pending.length} signals.\nNew patterns:\n${newEntries.join('\n')}`;
    });
  }
}
