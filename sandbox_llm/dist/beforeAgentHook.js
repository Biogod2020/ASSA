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
 * Aligned with official Gemini CLI Hook definitions.
 */
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
function ensureLocalSetup(workspaceRoot) {
    const memoryDir = path_1.default.resolve(workspaceRoot, '.memory');
    if (!fs_1.default.existsSync(memoryDir)) {
        fs_1.default.mkdirSync(memoryDir, { recursive: true });
    }
    [
        'patterns.md',
        'decisions.md',
        'local_habits.md',
        'LESSONS_LEARNED.md',
    ].forEach((file) => {
        const filePath = path_1.default.join(memoryDir, file);
        if (!fs_1.default.existsSync(filePath)) {
            fs_1.default.writeFileSync(filePath, `# ${file.split('.')[0].replace(/_/g, ' ').toUpperCase()}\n`, 'utf8');
        }
    });
}
const POTENTIAL_SIGNAL_HINTS = [
    'perfect',
    'exactly',
    'better',
    'prefer',
    'instead',
    'wrong',
    'correct',
    'should',
    'must',
    'always',
    'never',
    'refactor',
    'standard',
    '很好',
    '不错',
    '不对',
    '建议',
    '喜欢',
    '习惯',
    '应该',
    '千万',
    '记得',
];
function detectReflectionOpportunity(prompt) {
    let reflexContext = '';
    const currentText = prompt.toLowerCase();
    const hasHint = POTENTIAL_SIGNAL_HINTS.some((h) => currentText.includes(h));
    const isSubstantial = prompt.length > 30;
    if (hasHint || isSubstantial) {
        reflexContext +=
            '### ASSA REFLEX: SEMANTIC INTERACTION AUDIT ###\n' +
                'Recent user guidance contains potential architectural or stylistic preferences. ' +
                'You MUST analyze the semantic intent. Does this imply a recurring rule or a "Golden Standard"? ' +
                'Record any distilled wisdom into the L1 ledger immediately.\n\n';
    }
    return reflexContext;
}
function safeReadFile(filepath) {
    if (fs_1.default.existsSync(filepath))
        return fs_1.default.readFileSync(filepath, 'utf8') + '\n';
    return '';
}
async function main() {
    try {
        const inputData = fs_1.default.readFileSync(0, 'utf8');
        if (!inputData)
            return;
        const input = JSON.parse(inputData);
        const { session_id, prompt, cwd } = input;
        // Bypass for evolution subagents (if they set this env)
        if (process.env.ASSA_EVOLVING) {
            process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
            return;
        }
        ensureLocalSetup(cwd);
        // DIAGNOSTIC LOGGING
        const debugDir = path_1.default.join(cwd, '.memory', 'debug');
        if (!fs_1.default.existsSync(debugDir))
            fs_1.default.mkdirSync(debugDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(debugDir, `beforeAgent_${Date.now()}.json`), JSON.stringify({ input, env: { ASSA_EVOLVING: process.env.ASSA_EVOLVING } }, null, 2));
        const ledgerManager = new ledger_1.LedgerManager(cwd);
        const health = (0, healthCheck_1.checkSystemHealth)(cwd);
        const reflexContext = detectReflectionOpportunity(prompt);
        const globalDir = path_1.default.join(os_1.default.homedir(), '.gemini', 'assa');
        let additionalContext = '';
        if (health.status !== 'healthy') {
            additionalContext +=
                '### ASSA HEALTH WARNING ###\n' +
                    '⚠️ Your self-evolution environment has issues:\n' +
                    health.warnings.map((w) => `- ${w}`).join('\n') +
                    '\n';
        }
        additionalContext += `### ASSA SESSION ID: ${session_id} ###\n\n`;
        additionalContext += '### L2 PROJECT PATTERNS & DECISIONS ###\n';
        additionalContext += safeReadFile(path_1.default.join(cwd, '.memory/patterns.md'));
        additionalContext += safeReadFile(path_1.default.join(cwd, '.memory/decisions.md'));
        additionalContext += '\n### L3 GLOBAL WISDOM ###\n';
        additionalContext += safeReadFile(path_1.default.join(globalDir, 'SOUL.md'));
        additionalContext += safeReadFile(path_1.default.join(globalDir, 'USER_HANDBOOK.md'));
        // L1 Pending Signals
        const pendingItems = ledgerManager.getPending();
        if (pendingItems.length > 0) {
            additionalContext += `\n### L1 PENDING SIGNALS (${pendingItems.length} accumulated) ###\n`;
            additionalContext += JSON.stringify(pendingItems, null, 2) + '\n';
        }
        if (reflexContext) {
            additionalContext += `\n🚨 ASSA IMMEDIATE REFLEXES 🚨\n${reflexContext}\n`;
        }
        // Context Explosion Guard
        if (additionalContext.length > 20480) {
            additionalContext =
                `### ASSA SESSION ID: ${session_id} ###\n\n` +
                    `⚠️ CONTEXT SAFETY LIMIT EXCEEDED (${Math.round(additionalContext.length / 1024)} KB) ⚠️\n` +
                    'Invoke `distiller` to distill signals.\n';
        }
        const output = {
            decision: 'allow',
            hookSpecificOutput: {
                hookEventName: 'BeforeAgent',
                additionalContext,
            },
        };
        process.stdout.write(JSON.stringify(output) + '\n');
    }
    catch (err) {
        const debugDir = path_1.default.join(process.cwd(), '.memory', 'debug');
        if (!fs_1.default.existsSync(debugDir))
            fs_1.default.mkdirSync(debugDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(debugDir, `error_${Date.now()}.txt`), err.stack || err.message);
        process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
    }
}
if (typeof require !== 'undefined' && require.main === module) {
    main();
}
