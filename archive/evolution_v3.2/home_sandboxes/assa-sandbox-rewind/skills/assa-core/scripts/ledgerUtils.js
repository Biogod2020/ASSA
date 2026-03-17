const fs = require('fs');
const path = require('path');

const LEDGER_PATH = path.resolve(process.cwd(), '.memory/evolution_ledger.json');
const LOCK_PATH = path.resolve(process.cwd(), '.memory/evolution_ledger.json.lock');

function ensureMemoryDir() {
    const memoryDir = path.dirname(LEDGER_PATH);
    if (!fs.existsSync(memoryDir)) {
        fs.mkdirSync(memoryDir, { recursive: true });
    }
}

/**
 * Simple atomic file lock using mkdirSync (zero-dependency) with retries
 * @param {Function} callback 
 */
function withLock(callback) {
    ensureMemoryDir();
    const maxRetries = 50; // Increased retries
    let lockAcquired = false;

    for (let i = 0; i < maxRetries; i++) {
        try {
            fs.mkdirSync(LOCK_PATH);
            lockAcquired = true;
            break;
        } catch (err) {
            if (err.code === 'EEXIST') {
                // Wait and retry with a small random delay to reduce collision
                const retryDelay = Math.floor(Math.random() * 50) + 10;
                const start = Date.now();
                while (Date.now() - start < retryDelay) { /* block */ }
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
            fs.rmdirSync(LOCK_PATH);
        } catch (err) {
            // Ignore cleanup errors
        }
    }
}

function loadLedger() {
    if (!fs.existsSync(LEDGER_PATH)) {
        // We don't call saveLedger here to avoid recursive locking issues
        // if saveLedger also uses withLock. 
        // Instead, just return empty and let the caller decide.
        return [];
    }
    const data = fs.readFileSync(LEDGER_PATH, 'utf8');
    try {
        return JSON.parse(data || '[]');
    } catch (e) {
        return [];
    }
}

function saveLedger(ledger) {
    fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), 'utf8');
}

/**
 * Perform a thread-safe update to the ledger
 * @param {Function} updateFn (ledger) => updatedLedger
 */
function updateLedger(updateFn) {
    return withLock(() => {
        const ledger = loadLedger();
        const updated = updateFn(ledger);
        saveLedger(updated);
        return updated;
    });
}

function markProcessed(messageIds) {
    updateLedger((ledger) => {
        ledger.forEach(entry => {
            if (messageIds.includes(entry.message_id)) {
                entry.status = 'PROCESSED';
            }
        });
        return ledger;
    });
}

module.exports = {
    loadLedger,
    saveLedger,
    updateLedger, // New atomic update method
    markProcessed,
    withLock,
    LEDGER_PATH,
    LOCK_PATH
};
