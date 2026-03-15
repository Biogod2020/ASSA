const fs = require('fs');
const path = require('path');
const os = require('os');

const EXTENSION_ROOT = path.dirname(__dirname);
const LOG_PATH = path.join(EXTENSION_ROOT, 'hook_debug.log');
const ledgerUtils = require(path.join(EXTENSION_ROOT, 'skills', 'assa-core', 'scripts', 'ledgerUtils'));
const { checkSystemHealth } = require('./healthCheck');

function log(msg) {
    fs.appendFileSync(LOG_PATH, msg + '\n');
}

function ensureL3Setup() {
    const globalDir = path.join(os.homedir(), '.gemini', 'assa');
    const libraryDir = path.join(globalDir, 'LIBRARY');
    const templatesDir = path.join(EXTENSION_ROOT, 'templates');
    
    if (!fs.existsSync(libraryDir)) {
        fs.mkdirSync(libraryDir, { recursive: true });
    }

    ['SOUL.md', 'USER_HANDBOOK.md', 'index.json'].forEach(filename => {
        const src = path.join(templatesDir, filename);
        const dst = path.join(globalDir, filename);
        if (fs.existsSync(src) && !fs.existsSync(dst)) {
            log(`Restoring missing template: ${filename}`);
            fs.copyFileSync(src, dst);
        }
    });
}

function ensureLocalSetup() {
    const memoryDir = path.resolve(process.cwd(), '.memory');
    if (!fs.existsSync(memoryDir)) {
        log('Creating missing .memory directory');
        fs.mkdirSync(memoryDir, { recursive: true });
    }
    ['patterns.md', 'decisions.md', 'local_habits.md', 'LESSONS_LEARNED.md'].forEach(file => {
        const filePath = path.join(memoryDir, file);
        if (!fs.existsSync(filePath)) {
            log(`Initializing missing local file: ${file}`);
            fs.writeFileSync(filePath, `# ${file.split('.')[0].replace(/_/g, ' ').toUpperCase()}\n`, 'utf8');
        }
    });
}

function safeReadFile(filepath) {
    const absolutePath = path.resolve(process.cwd(), filepath);
    if (fs.existsSync(absolutePath)) return fs.readFileSync(absolutePath, 'utf8') + '\n';
    return '';
}

function cascadeRewound(ledger, transcript, sessionId) {
    if (!sessionId) return { ledger, changed: false };
    const activeMessageIds = new Set(
        transcript
            .filter(turn => turn.id)
            .map(turn => turn.id)
    );
    let changed = false;
    for (const entry of ledger) {
        if (entry.session_id === sessionId && (entry.status === 'PENDING' || entry.status === 'PROCESSED') && !activeMessageIds.has(entry.message_id)) {
            entry.status = 'REWOUND';
            changed = true;
        }
    }
    return { ledger, changed };
}

function extractAllText(turn) {
    let text = turn.content || '';
    if (Array.isArray(text)) {
        text = text.map(c => c.text || '').join(' ');
    }
    if (turn.toolCalls) {
        turn.toolCalls.forEach(tc => {
            if (tc.result) {
                if (typeof tc.result === 'string') text += ' ' + tc.result;
                else text += ' ' + JSON.stringify(tc.result);
            }
        });
    }
    return text;
}

function isToolFailure(turn) {
    const text = extractAllText(turn);
    if (text.includes('ASSA_METADATA: [FAILED:')) return true;
    if (text.includes('ASSA_METADATA: [SUCCESS:')) return false;
    
    // Heuristic fallback for turns that didn't go through AfterTool yet (e.g., historical)
    if (turn.toolCalls) {
        return turn.toolCalls.some(tc => {
            const res = JSON.stringify(tc.result || '');
            return res.includes('Exit Code: 1') || res.toLowerCase().includes('error:');
        });
    }
    return false;
}

function isToolSuccess(turn) {
    const text = extractAllText(turn);
    if (text.includes('ASSA_METADATA: [SUCCESS:')) return true;
    if (text.includes('ASSA_METADATA: [FAILED:')) return false;
    
    if (turn.toolCalls) {
        return turn.toolCalls.every(tc => {
            const res = JSON.stringify(tc.result || '');
            return !res.includes('Exit Code: 1') && !res.toLowerCase().includes('error:');
        });
    }
    return false;
}

function recognizeReflex(transcript) {
    if (!transcript || transcript.length === 0) return '';
    
    let reflexContext = '';
    const lastTurn = transcript[transcript.length - 1];
    
    if (lastTurn.type === 'user') {
        const userText = extractAllText(lastTurn);
        const keywords = ['很好', 'Perfect', 'Exactly', '不错', '太棒了', 'Great', 'Awesome'];
        if (keywords.some(k => userText.includes(k))) {
            reflexContext += '### ASSA REFLEX: PRAISE DETECTED ###\n' +
                '你必须评估这是否代表了一个成功的模式（Success Pattern）。如果是，请立即调用 `submit_memory_signal` 记录它。\n\n';
        }
    }

    const toolTurns = transcript.filter(t => t.toolCalls && t.toolCalls.length > 0);
    if (toolTurns.length >= 2) {
        // Scan for Victory (anywhere in history)
        for (let i = 1; i < toolTurns.length; i++) {
            if (isToolFailure(toolTurns[i - 1]) && isToolSuccess(toolTurns[i])) {
                reflexContext += '### ASSA REFLEX: VICTORY DETECTED ###\n' +
                    'Detected a breakthrough: A previously failing tool has now succeeded.\n' +
                    '请总结导致成功的关键变动，并调用 `submit_memory_signal` 记录这个 "Success Pattern"。\n\n';
                break; // Only need one victory prompt
            }
        }
        
        // Scan for Barrier (anywhere in history)
        for (let i = 2; i < toolTurns.length; i++) {
            if (isToolFailure(toolTurns[i - 2]) && isToolFailure(toolTurns[i - 1]) && isToolFailure(toolTurns[i])) {
                reflexContext += '### ASSA REFLEX: BARRIER DETECTED ###\n' +
                    'Detected a technical barrier: 3 consecutive tool failures.\n' +
                    '你似乎遇到了阻碍。请分析根本原因，并调用 `submit_memory_signal` (type: negative) 记录这个 "Technical Barrier"。\n\n';
                break; // Only need one barrier prompt
            }
        }
    }

    return reflexContext;
}

function main() {
    log(`BeforeAgent Hook Fired at ${new Date().toISOString()}`);
    let inputData = '';
    try {
        inputData = fs.readFileSync(0, 'utf8');
    } catch (err) {
        log(`Error reading stdin: ${err.message}`);
    }

    if (!inputData) {
        console.log(JSON.stringify({ decision: 'allow' }));
        return;
    }

    let payload;
    try {
        payload = JSON.parse(inputData);
    } catch (e) {
        log(`JSON parse error: ${e.message}`);
        console.log(JSON.stringify({ decision: 'allow' }));
        return;
    }

    const agentName = payload.agentName || 'main';
    const sessionId = payload.sessionId || payload.session_id || 'unknown';
    const overrides = payload.overrides || {};
    
    let transcript = payload.transcript || [];
    if (payload.transcript_path && fs.existsSync(payload.transcript_path)) {
        try {
            const fileContent = fs.readFileSync(payload.transcript_path, 'utf8');
            const history = JSON.parse(fileContent);
            transcript = history.messages || (Array.isArray(history) ? history : []);
        } catch (e) {
            log(`Error reading transcript file: ${e.message}`);
        }
    }
    
    log(`Agent: ${agentName}, Session: ${sessionId}, Active Transcript Turns: ${transcript.length}`);

    if (['distiller', 'syncer'].includes(agentName.toLowerCase()) || process.env.ASSA_EVOLVING) {
        console.log(JSON.stringify({ decision: 'allow' }));
        return;
    }

    ensureL3Setup();
    ensureLocalSetup();

    const health = checkSystemHealth(process.cwd(), overrides);
    
    // Check if mandatory ASSA tools are available in the current context
    const availableTools = payload.tools || [];
    const hasAssaTools = availableTools.some(t => t.name.includes('submit_memory_signal'));
    if (!hasAssaTools && !process.env.ASSA_EVOLVING) {
        health.status = 'warning';
        health.warnings.push('Mandatory evolution tools are missing. Ensure you started Gemini with --allowed-mcp-server-names assa-mcp.');
        health.fixSuggestion = 'Restart Gemini with: gemini --allowed-mcp-server-names assa-mcp';
    }

    let healthContext = '';
    if (health.status !== 'healthy') {
        healthContext = '### ASSA HEALTH WARNING ###\n' +
            '⚠️ Your self-evolution environment has issues:\n' +
            health.warnings.map(w => `- ${w}`).join('\n') + '\n';
        if (health.fixSuggestion) {
            healthContext += `💡 Suggestion: ${health.fixSuggestion}\n`;
        }
        healthContext += 'Please resolve these to ensure ASSA can continue to evolve.\n\n';
    }

    let ledger;
    try {
        ledger = ledgerUtils.updateLedger((l) => {
            const { ledger: updatedLedger, changed } = cascadeRewound(l, transcript, sessionId);
            return updatedLedger;
        });
    } catch (e) {
        ledger = ledgerUtils.loadLedger();
    }

    const reflexContext = recognizeReflex(transcript);
    const globalDir = path.join(os.homedir(), '.gemini', 'assa');
    let additionalContext = healthContext + reflexContext;
    additionalContext += `### ASSA SESSION ID: ${sessionId} ###\n\n`;
    additionalContext += '### L3 GLOBAL WISDOM ###\n';
    additionalContext += safeReadFile(path.join(globalDir, 'SOUL.md'));
    additionalContext += safeReadFile(path.join(globalDir, 'USER_HANDBOOK.md'));
    const pendingItems = ledger.filter(e => e.status === 'PENDING');
    if (pendingItems.length >= 5) {
        additionalContext += `### L1 PENDING SIGNALS (${pendingItems.length} accumulated — DEEP DISTILLATION REQUIRED) ###\n`;
        additionalContext += `⚠️ ${pendingItems.length} signals have accumulated. 你必须立即调用 \`distiller\` 工具作为子代理（Subagent），`;
        additionalContext += '派发以下任务给它："读取最新的这些信号及其相关的 git diff，执行深度根因分析，并生成结构化的 patterns.md 规则块（带 YAML 和 Rationale）。" \n';
        additionalContext += '在派发完成后，请直接告诉我任务已派发，不要亲自执行该分析。\n';
        additionalContext += JSON.stringify(pendingItems, null, 2) + '\n\n';
    } else if (pendingItems.length > 0) {
        additionalContext += '### L1 PENDING SIGNALS (use distill_pending tool for quick processing) ###\n';
        additionalContext += JSON.stringify(pendingItems, null, 2) + '\n\n';
    }
        
    additionalContext += '### L2 PROJECT PATTERNS & DECISIONS ###\n';
    additionalContext += safeReadFile('.memory/patterns.md');
    additionalContext += safeReadFile('.memory/decisions.md');

    console.log(JSON.stringify({
        decision: 'allow',
        hookSpecificOutput: { additionalContext }
    }));
}

main();
