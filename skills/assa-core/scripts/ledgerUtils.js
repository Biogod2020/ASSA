const fs = require('fs');
const path = require('path');

function getPaths(cwd = process.cwd()) {
    const memoryDir = path.resolve(cwd, '.memory');
    return {
        memoryDir,
        ledgerPath: path.join(memoryDir, 'evolution_ledger.json'),
        lockPath: path.join(memoryDir, 'evolution_ledger.json.lock')
    };
}

function ensureMemoryDir(cwd) {
    const { memoryDir } = getPaths(cwd);
    if (!fs.existsSync(memoryDir)) {
        fs.mkdirSync(memoryDir, { recursive: true });
    }
}

/**
 * Simple atomic file lock using mkdirSync (zero-dependency) with retries
 * @param {Function} callback 
 * @param {string} cwd
 */
function withLock(callback, cwd) {
    ensureMemoryDir(cwd);
    const { lockPath } = getPaths(cwd);
    const maxRetries = 50; 
    let lockAcquired = false;

    for (let i = 0; i < maxRetries; i++) {
        try {
            fs.mkdirSync(lockPath);
            lockAcquired = true;
            break;
        } catch (err) {
            if (err.code === 'EEXIST') {
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
            fs.rmdirSync(lockPath);
        } catch (err) {
            // Ignore cleanup errors
        }
    }
}

function loadLedger(cwd) {
    const { ledgerPath } = getPaths(cwd);
    if (!fs.existsSync(ledgerPath)) {
        return [];
    }
    const data = fs.readFileSync(ledgerPath, 'utf8');
    try {
        return JSON.parse(data || '[]');
    } catch (e) {
        return [];
    }
}

function saveLedger(ledger, cwd) {
    const { ledgerPath } = getPaths(cwd);
    fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), 'utf8');
}

/**
 * Perform a thread-safe update to the ledger
 * @param {Function} updateFn (ledger) => updatedLedger
 * @param {string} cwd
 */
function updateLedger(updateFn, cwd) {
    return withLock(() => {
        const ledger = loadLedger(cwd);
        const updated = updateFn(ledger);
        saveLedger(updated, cwd);
        return updated;
    }, cwd);
}

function markProcessed(messageIds, cwd) {
    updateLedger((ledger) => {
        ledger.forEach(entry => {
            if (messageIds.includes(entry.message_id)) {
                entry.status = 'PROCESSED';
            }
        });
        return ledger;
    }, cwd);
}

module.exports = {
    loadLedger,
    saveLedger,
    updateLedger,
    markProcessed,
    withLock,
    getPaths // Replaces static LEDGER_PATH/LOCK_PATH exports
};
