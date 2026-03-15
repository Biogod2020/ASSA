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
            .filter(turn => turn.messageId)
            .map(turn => turn.messageId)
    );
    let changed = false;
    for (const entry of ledger) {
        // Only mark as REWOUND if the signal belongs to the CURRENT session
        if (entry.session_id === sessionId && (entry.status === 'PENDING' || entry.status === 'PROCESSED') && !activeMessageIds.has(entry.message_id)) {
            entry.status = 'REWOUND';
            changed = true;
        }
    }
    return { ledger, changed };
}

function extractText(turn) {
    if (typeof turn.content === 'string') return turn.content;
    if (Array.isArray(turn.content)) {
        return turn.content
            .map(c => {
                if (c.type === 'text') return c.text;
                if (c.type === 'tool_result') return c.content;
                return '';
            })
            .join(' ');
    }
    return '';
}

function isToolFailure(turn) {
    if (turn.role !== 'tool' && turn.role !== 'tool_result') return false;
    const content = extractText(turn);
    // Exit codes other than 0 indicate failure
    const exitCodeMatch = content.match(/Exit Code: (\d+)/);
    if (exitCodeMatch && exitCodeMatch[1] !== '0') return true;
    // Typical error indicators
    if (content.toLowerCase().includes('error:') || content.toLowerCase().includes('failed:')) {
        // But avoid false positives for things like "No errors found"
        if (!content.toLowerCase().includes('no error')) return true;
    }
    return false;
}

function isToolSuccess(turn) {
    if (turn.role !== 'tool' && turn.role !== 'tool_result') return false;
    const content = extractText(turn);
    if (content.includes('Exit Code: 0')) return true;
    if (content.length > 0 && !isToolFailure(turn)) return true;
    return false;
}

function recognizeReflex(transcript) {
    if (!transcript || transcript.length === 0) return '';
    
    let reflexContext = '';
    const lastTurn = transcript[transcript.length - 1];
    
    // 1. High-Sentiment Detection (Signal Sensitivity)
    if (lastTurn.role === 'user') {
        const userText = extractText(lastTurn);
        const keywords = ['很好', 'Perfect', 'Exactly', '不错', '太棒了', 'Great', 'Awesome', 'Success', 'Correct', 'Fixed'];
        if (keywords.some(k => userText.includes(k))) {
            reflexContext += '### ASSA REFLEX: PRAISE DETECTED ###\n' +
                `User expressed satisfaction: "${userText.trim()}"\n` +
                '你必须评估这是否代表了一个成功的模式（Success Pattern）。如果是，请立即调用 `submit_memory_signal` 记录它。\n\n';
        }
    }

    // 2. Victory & Barrier Detection (Sequence Analysis)
    const toolTurns = transcript.filter(t => t.role === 'tool' || t.role === 'tool_result');
    if (toolTurns.length >= 2) {
        const lastTool = toolTurns[toolTurns.length - 1];
        const prevTool = toolTurns[toolTurns.length - 2];
        
        // Victory: Fail -> Success
        if (isToolFailure(prevTool) && isToolSuccess(lastTool)) {
            reflexContext += '### ASSA REFLEX: VICTORY DETECTED ###\n' +
                'Detected a breakthrough: A previously failing tool has now succeeded.\n' +
                '请总结导致成功的关键变动，并调用 `submit_memory_signal` 记录这个 "Success Pattern"。\n\n';
        }
        
        // Barrier: 3 consecutive failures
        if (toolTurns.length >= 3) {
            const last3 = toolTurns.slice(-3);
            if (last3.every(isToolFailure)) {
                reflexContext += '### ASSA REFLEX: BARRIER DETECTED ###\n' +
                    'Detected a technical barrier: 3 consecutive tool failures.\n' +
                    '你似乎遇到了阻碍。请分析根本原因，并调用 `submit_memory_signal` (type: negative) 记录这个 "Technical Barrier"。\n\n';
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
        log(`Read ${inputData.length} bytes from stdin`);
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
    
    // Load transcript from file if path is provided
    let transcript = payload.transcript || [];
    if (payload.transcript_path && fs.existsSync(payload.transcript_path)) {
        try {
            const fileContent = fs.readFileSync(payload.transcript_path, 'utf8');
            const history = JSON.parse(fileContent);
            // Gemini CLI history usually has a 'messages' array or is the array itself
            transcript = history.messages || (Array.isArray(history) ? history : []);
            log(`Loaded ${transcript.length} turns from transcript_path: ${payload.transcript_path}`);
        } catch (e) {
            log(`Error reading transcript file: ${e.message}`);
        }
    }
    
    log(`Agent: ${agentName}, Session: ${sessionId}, Active Transcript Turns: ${transcript.length}`);

    // Bypass for internal evolution agents
    if (['distiller', 'syncer'].includes(agentName.toLowerCase()) || process.env.ASSA_EVOLVING) {
        log(`Bypassing hook (ASSA_EVOLVING=${process.env.ASSA_EVOLVING}, Agent=${agentName})`);
        console.log(JSON.stringify({ decision: 'allow' }));
        return;
    }

    ensureL3Setup();
    ensureLocalSetup();

    // 1. Run Health Check
    const health = checkSystemHealth();
    let healthContext = '';
    if (health.status !== 'healthy') {
        log(`ASSA Health Warning: ${health.warnings.join(' | ')}`);
        healthContext = '### ASSA HEALTH WARNING ###\n' +
            '⚠️ Your self-evolution environment has issues:\n' +
            health.warnings.map(w => `- ${w}`).join('\n') + '\n';
        if (health.fixSuggestion) {
            healthContext += `💡 Suggestion: ${health.fixSuggestion}\n`;
        }
        healthContext += 'Please resolve these to ensure ASSA can continue to evolve.\n\n';
    }

    // 2. Update Ledger State (Rewind Defense)
    let ledger;
    try {
        ledger = ledgerUtils.updateLedger((l) => {
            const { ledger: updatedLedger, changed } = cascadeRewound(l, transcript, sessionId);
            if (changed) {
                log('Detected rewind → updated ledger statuses');
            }
            return updatedLedger;
        });
    } catch (e) {
        log(`Lock error during rewind check: ${e.message}`);
        ledger = ledgerUtils.loadLedger(); // Fallback to read-only
    }

    // 3. Smart Reflex Pattern Matching
    const reflexContext = recognizeReflex(transcript);

    // Assemble context — NO sub-agent spawning, just fast context injection
    const globalDir = path.join(os.homedir(), '.gemini', 'assa');
    let additionalContext = healthContext + reflexContext;
    additionalContext += '### L3 GLOBAL WISDOM ###\n';
    additionalContext += safeReadFile(path.join(globalDir, 'SOUL.md'));
    additionalContext += safeReadFile(path.join(globalDir, 'USER_HANDBOOK.md'));
    additionalContext += safeReadFile(path.join(globalDir, 'index.json'));
    
    const pendingItems = ledger.filter(e => e.status === 'PENDING');
    const DEEP_DISTILL_THRESHOLD = 5;
    if (pendingItems.length >= DEEP_DISTILL_THRESHOLD) {
        additionalContext += `### L1 PENDING SIGNALS (${pendingItems.length} accumulated — DEEP DISTILLATION REQUIRED) ###\n`;
        additionalContext += `⚠️ ${pendingItems.length} signals have accumulated. 你必须立即调用 \`generalist\` 工具作为子代理（Subagent），`;
        additionalContext += '派发以下任务给它："作为 ASSA Distiller，读取最新的这些信号及其相关的 git diff，执行深度根因分析，并生成结构化的 patterns.md 规则块（带 YAML 和 Rationale）。注意：完成写入后，你必须调用 `complete_task` 工具来结束任务。" ';
        additionalContext += '在派发完成后，请直接告诉我任务已派发，不要亲自执行该分析。\n';
        additionalContext += JSON.stringify(pendingItems, null, 2) + '\n\n';
    } else if (pendingItems.length > 0) {
        additionalContext += '### L1 PENDING SIGNALS (use distill_pending tool for quick processing) ###\n';
        additionalContext += JSON.stringify(pendingItems, null, 2) + '\n\n';
    }
        
    additionalContext += '### L2 PROJECT PATTERNS & DECISIONS ###\n';
    additionalContext += safeReadFile('.memory/patterns.md');
    additionalContext += safeReadFile('.memory/decisions.md');
    additionalContext += safeReadFile('.memory/local_habits.md');
    additionalContext += safeReadFile('.memory/LESSONS_LEARNED.md');

    log(`Context assembled: ${additionalContext.length} chars, ${pendingItems.length} pending signals`);

    console.log(JSON.stringify({
        decision: 'allow',
        hookSpecificOutput: { additionalContext }
    }));
}

main();
