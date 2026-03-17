"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const ledger_1 = require("./ledger");
const healthCheck_1 = require("./healthCheck");
/**
 * ASSA BeforeAgent Hook
 * Manages context injection and evolutionary state.
 */
const PRAISE_KEYWORDS = [
    '很好', 'Perfect', 'Exactly', '不错', '太棒了', 'Great', 'Awesome',
    '完美', '干得漂亮', '棒', '赞'
];
function ensureL3Setup(extensionPath) {
    const globalDir = path_1.default.join(os_1.default.homedir(), '.gemini', 'assa');
    const libraryDir = path_1.default.join(globalDir, 'LIBRARY');
    const templatesDir = path_1.default.join(extensionPath, 'templates');
    if (!fs_1.default.existsSync(libraryDir)) {
        fs_1.default.mkdirSync(libraryDir, { recursive: true });
    }
    ['SOUL.md', 'USER_HANDBOOK.md', 'index.json'].forEach((filename) => {
        const src = path_1.default.join(templatesDir, filename);
        const dst = path_1.default.join(globalDir, filename);
        if (fs_1.default.existsSync(src) && !fs_1.default.existsSync(dst)) {
            fs_1.default.copyFileSync(src, dst);
        }
    });
}
function ensureLocalSetup() {
    const memoryDir = path_1.default.resolve(process.cwd(), '.memory');
    if (!fs_1.default.existsSync(memoryDir)) {
        fs_1.default.mkdirSync(memoryDir, { recursive: true });
    }
    ['patterns.md', 'decisions.md', 'local_habits.md', 'LESSONS_LEARNED.md'].forEach((file) => {
        const filePath = path_1.default.join(memoryDir, file);
        if (!fs_1.default.existsSync(filePath)) {
            fs_1.default.writeFileSync(filePath, `# ${file.split('.')[0].replace(/_/g, ' ').toUpperCase()}\n`, 'utf8');
        }
    });
}
function extractAllText(turn) {
    let text = '';
    if (typeof turn.content === 'string') {
        text += turn.content;
    }
    else if (Array.isArray(turn.content)) {
        text += turn.content.map((c) => c.text || '').join(' ');
    }
    if (turn.toolCalls) {
        turn.toolCalls.forEach((tc) => {
            if (tc.result) {
                if (Array.isArray(tc.result)) {
                    tc.result.forEach((r) => {
                        if (r.functionResponse && r.functionResponse.response) {
                            const resp = r.functionResponse.response;
                            text += ' ' + (typeof resp === 'string' ? resp : (resp.output || JSON.stringify(resp)));
                        }
                        else {
                            text += ' ' + JSON.stringify(r);
                        }
                    });
                }
                else if (typeof tc.result === 'string') {
                    text += ' ' + tc.result;
                }
                else {
                    text += ' ' + JSON.stringify(tc.result);
                }
            }
            if (tc.resultDisplay) {
                text += ' ' + tc.resultDisplay;
            }
        });
    }
    return text;
}
function isToolFailure(turn) {
    const text = extractAllText(turn);
    if (text.includes('ASSA_METADATA: [FAILED:'))
        return true;
    if (text.includes('ASSA_METADATA: [SUCCESS:'))
        return false;
    if (turn.toolCalls) {
        return turn.toolCalls.some((tc) => {
            if (tc.status === 'error')
                return true;
            const res = JSON.stringify(tc.result || '');
            return res.includes('Exit Code: 1') || res.toLowerCase().includes('error:');
        });
    }
    return false;
}
function isToolSuccess(turn) {
    const text = extractAllText(turn);
    if (text.includes('ASSA_METADATA: [SUCCESS:'))
        return true;
    if (text.includes('ASSA_METADATA: [FAILED:'))
        return false;
    if (turn.toolCalls) {
        return turn.toolCalls.every((tc) => {
            if (tc.status === 'success')
                return true;
            const res = JSON.stringify(tc.result || '');
            return !res.includes('Exit Code: 1') && !res.toLowerCase().includes('error:');
        });
    }
    return false;
}
function recognizeReflex(transcript, currentPrompt) {
    let reflexContext = '';
    const hasPraiseInPrompt = currentPrompt && PRAISE_KEYWORDS.some((k) => currentPrompt.includes(k));
    const recentTurns = transcript.slice(-3);
    const hasPraiseInTranscript = recentTurns.some((turn) => {
        if (turn.type === 'user') {
            const userText = extractAllText(turn);
            return PRAISE_KEYWORDS.some((k) => userText.includes(k));
        }
        return false;
    });
    if (hasPraiseInPrompt || hasPraiseInTranscript) {
        reflexContext += '### ASSA REFLEX: PRAISE DETECTED ###\n' +
            'You just received positive feedback from the user. You MUST evaluate if this represents a Success Pattern. If so, immediately call `submit_memory_signal` to record it.\n\n';
    }
    const toolTurns = transcript.filter((t) => t.toolCalls && t.toolCalls.length > 0);
    if (toolTurns.length >= 2) {
        for (let i = 1; i < toolTurns.length; i++) {
            if (isToolFailure(toolTurns[i - 1]) && isToolSuccess(toolTurns[i])) {
                reflexContext += '### ASSA REFLEX: VICTORY DETECTED ###\n' +
                    'Detected a breakthrough: A previously failing tool has now succeeded.\n' +
                    'Please summarize the key changes that led to this victory and call `submit_memory_signal` to record this "Success Pattern".\n\n';
                break;
            }
        }
        for (let i = 2; i < toolTurns.length; i++) {
            if (isToolFailure(toolTurns[i - 2]) && isToolFailure(toolTurns[i - 1]) && isToolFailure(toolTurns[i])) {
                reflexContext += '### ASSA REFLEX: BARRIER DETECTED ###\n' +
                    'Detected a technical barrier: 3 consecutive tool failures.\n' +
                    'You seem to be facing a barrier. Please perform a Root Cause Analysis (RCA) and call `submit_memory_signal` (type: negative) to record this "Technical Barrier".\n\n';
                break;
            }
        }
    }
    return reflexContext;
}
function cascadeRewound(ledger, transcript, sessionId) {
    if (!sessionId)
        return false;
    let allTranscriptContent = '';
    transcript.forEach((turn) => {
        allTranscriptContent += (turn.id || '') + ' ';
        allTranscriptContent += extractAllText(turn) + ' ';
    });
    let changed = false;
    for (const entry of ledger) {
        if (entry.session_id === sessionId) {
            const isPresent = allTranscriptContent.includes(entry.message_id);
            if ((entry.status === 'PENDING' || entry.status === 'PROCESSED') && !isPresent) {
                entry.status = 'REWOUND';
                changed = true;
            }
            else if (entry.status === 'REWOUND' && isPresent) {
                entry.status = 'PENDING';
                changed = true;
            }
        }
    }
    return changed;
}
function safeReadFile(filepath) {
    if (fs_1.default.existsSync(filepath))
        return fs_1.default.readFileSync(filepath, 'utf8') + '\n';
    return '';
}
async function main() {
    try {
        const inputData = fs_1.default.readFileSync(0, 'utf8');
        if (!inputData) {
            process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
            return;
        }
        const payload = JSON.parse(inputData);
        const agentName = payload.agentName || 'main';
        const sessionId = payload.sessionId || payload.session_id || 'unknown';
        const currentPrompt = payload.prompt || '';
        const overrides = payload.overrides || {};
        const extensionPath = payload.extensionPath || '';
        let transcript = [];
        if (payload.transcript_path && fs_1.default.existsSync(payload.transcript_path)) {
            try {
                const fileContent = fs_1.default.readFileSync(payload.transcript_path, 'utf8');
                const history = JSON.parse(fileContent);
                transcript = history.messages || (Array.isArray(history) ? history : []);
            }
            catch (e) { }
        }
        // Bypass for evolution agents
        if (['distiller', 'syncer'].includes(agentName.toLowerCase()) || process.env.ASSA_EVOLVING) {
            process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
            return;
        }
        if (extensionPath) {
            ensureL3Setup(extensionPath);
        }
        ensureLocalSetup();
        const ledgerManager = new ledger_1.LedgerManager(process.cwd());
        ledgerManager.updateStatus((ledger) => {
            cascadeRewound(ledger, transcript, sessionId);
        });
        const health = (0, healthCheck_1.checkSystemHealth)(process.cwd(), overrides);
        const reflexContext = recognizeReflex(transcript, currentPrompt);
        const globalDir = path_1.default.join(os_1.default.homedir(), '.gemini', 'assa');
        let additionalContext = '';
        if (health.status !== 'healthy') {
            additionalContext += '### ASSA HEALTH WARNING ###\n' +
                '⚠️ Your self-evolution environment has issues:\n' +
                health.warnings.map((w) => `- ${w}`).join('\n') + '\n' +
                (health.fixSuggestion ? `💡 Suggestion: ${health.fixSuggestion}\n` : '') + '\n';
        }
        additionalContext += `### ASSA SESSION ID: ${sessionId} ###\n\n`;
        additionalContext += '### L2 PROJECT PATTERNS & DECISIONS ###\n';
        additionalContext += safeReadFile('.memory/patterns.md');
        additionalContext += safeReadFile('.memory/decisions.md');
        additionalContext += '\n### L3 GLOBAL WISDOM ###\n';
        additionalContext += safeReadFile(path_1.default.join(globalDir, 'SOUL.md'));
        additionalContext += safeReadFile(path_1.default.join(globalDir, 'USER_HANDBOOK.md'));
        additionalContext += safeReadFile(path_1.default.join(globalDir, 'LIBRARY', 'PROMOTED_PATTERNS.md'));
        // Domain-Aware Loading
        const libraryDir = path_1.default.join(globalDir, 'LIBRARY');
        const indexPath = path_1.default.join(libraryDir, 'index.json');
        if (fs_1.default.existsSync(indexPath)) {
            try {
                const index = JSON.parse(fs_1.default.readFileSync(indexPath, 'utf8'));
                const cwd = process.cwd().toLowerCase();
                if (index.mappings && Array.isArray(index.mappings)) {
                    index.mappings.forEach((m) => {
                        if (m.domains.some((d) => cwd.includes(d.toLowerCase()))) {
                            additionalContext += safeReadFile(path_1.default.join(libraryDir, m.pattern));
                        }
                    });
                }
            }
            catch (e) { }
        }
        // L1 Pending Signals
        const pendingItems = ledgerManager.getPending();
        if (pendingItems.length >= 5) {
            additionalContext += `\n### L1 PENDING SIGNALS (${pendingItems.length} accumulated — DEEP DISTILLATION REQUIRED) ###\n`;
            additionalContext += `⚠️ ${pendingItems.length} signals accumulated. Invoke \`distiller\` as subagent.\n`;
            additionalContext += JSON.stringify(pendingItems, null, 2) + '\n';
        }
        else if (pendingItems.length > 0) {
            additionalContext += '\n### L1 PENDING SIGNALS (use distill_pending tool for quick processing) ###\n';
            additionalContext += JSON.stringify(pendingItems, null, 2) + '\n';
        }
        if (reflexContext) {
            additionalContext += `\n🚨 ASSA IMMEDIATE REFLEXES 🚨\n${reflexContext}\n`;
        }
        // Context Explosion Guard
        if (additionalContext.length > 20480) {
            additionalContext = `### ASSA SESSION ID: ${sessionId} ###\n\n` +
                `⚠️ CONTEXT SAFETY LIMIT EXCEEDED (${Math.round(additionalContext.length / 1024)} KB) ⚠️\n` +
                'Invoke `distiller` to distill signals.\n';
        }
        process.stdout.write(JSON.stringify({
            decision: 'allow',
            hookSpecificOutput: { additionalContext }
        }) + '\n');
    }
    catch (err) {
        process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
    }
}
if (typeof require !== 'undefined' && require.main === module) {
    main();
}
