"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class LedgerManager {
    ledgerPath;
    lockPath;
    constructor(workspaceRoot) {
        this.ledgerPath = path_1.default.join(workspaceRoot, '.memory', 'evolution_ledger.json');
        this.lockPath = path_1.default.join(workspaceRoot, '.memory', 'evolution_ledger.json.lock');
    }
    ensureMemoryDir() {
        const dir = path_1.default.dirname(this.ledgerPath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    }
    /**
     * Atomic file lock using mkdirSync with retries
     */
    withLock(callback) {
        this.ensureMemoryDir();
        const maxRetries = 50;
        let lockAcquired = false;
        for (let i = 0; i < maxRetries; i++) {
            try {
                fs_1.default.mkdirSync(this.lockPath);
                lockAcquired = true;
                break;
            }
            catch (err) {
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
        }
        finally {
            try {
                fs_1.default.rmdirSync(this.lockPath);
            }
            catch (err) {
                // Ignore cleanup errors
            }
        }
    }
    readLedger() {
        if (!fs_1.default.existsSync(this.ledgerPath)) {
            return [];
        }
        try {
            const data = fs_1.default.readFileSync(this.ledgerPath, 'utf8');
            return JSON.parse(data || '[]');
        }
        catch (err) {
            console.error('Error reading ledger:', err);
            return [];
        }
    }
    writeLedger(ledger) {
        this.ensureMemoryDir();
        fs_1.default.writeFileSync(this.ledgerPath, JSON.stringify(ledger, null, 2), 'utf8');
    }
    addSignal(signal) {
        return this.withLock(() => {
            const ledger = this.readLedger();
            const record = {
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
    getPending() {
        return this.readLedger().filter((s) => s.status === 'PENDING');
    }
    markProcessed(messageIds) {
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
    updateStatus(updateFn) {
        this.withLock(() => {
            const ledger = this.readLedger();
            updateFn(ledger);
            this.writeLedger(ledger);
        });
    }
    distillPending(patternsPath) {
        return this.withLock(() => {
            const ledger = this.readLedger();
            const pending = ledger.filter((s) => s.status === 'PENDING');
            if (pending.length === 0) {
                return 'No pending signals to distill.';
            }
            let patternsContent = '# PATTERNS\n';
            if (fs_1.default.existsSync(patternsPath)) {
                patternsContent = fs_1.default.readFileSync(patternsPath, 'utf8');
            }
            const newEntries = pending.map((s) => {
                const tags = s.payload.tags.length > 0 ? s.payload.tags.join('/') : 'general';
                return `- **${tags}**: ${s.payload.rule} (from ${s.message_id})`;
            });
            patternsContent =
                patternsContent.trimEnd() + '\n' + newEntries.join('\n') + '\n';
            fs_1.default.writeFileSync(patternsPath, patternsContent, 'utf8');
            // Mark as processed
            pending.forEach((s) => {
                s.status = 'PROCESSED';
            });
            this.writeLedger(ledger);
            return `Distilled ${pending.length} signals.\nNew patterns:\n${newEntries.join('\n')}`;
        });
    }
}
exports.LedgerManager = LedgerManager;
