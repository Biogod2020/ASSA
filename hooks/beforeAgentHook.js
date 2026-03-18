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

// Redirect all unexpected logs to stderr to keep stdout pure for JSON
console.log = console.error;
console.warn = console.error;

process.on('uncaughtException', (err) => {
    log(`UNCAUGHT EXCEPTION in BeforeAgent: ${err.stack}`);
    process.exit(0);
});

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
    
    try {
        // Collect all unique IDs and all text from the transcript
        let allTranscriptContent = '';
        transcript.forEach(turn => {
            allTranscriptContent += (turn.id || '') + ' ';
            allTranscriptContent += extractAllText(turn) + ' ';
        });

        let changed = false;
        for (const entry of ledger) {
            if (entry.session_id === sessionId) {
                const isPresent = allTranscriptContent.includes(entry.message_id);
                
                if ((entry.status === 'PENDING' || entry.status === 'PROCESSED') && !isPresent) {
                    log(`REWIND DETECTED: Signal ${entry.message_id} not found in transcript. Marking as REWOUND.`);
                    entry.status = 'REWOUND';
                    changed = true;
                } else if (entry.status === 'REWOUND' && isPresent) {
                    log(`RECOVERY DETECTED: Signal ${entry.message_id} reappeared in transcript. Restoring to PENDING.`);
                    entry.status = 'PENDING'; // Restore to PENDING for re-distillation if needed
                    changed = true;
                }
            }
        }
        return { ledger, changed };
    } catch (err) {
        log(`ERROR in cascadeRewound: ${err.stack}`);
        return { ledger, changed: false };
    }
}

function extractAllText(turn) {
    let text = turn.content || '';
    if (Array.isArray(text)) {
        text = text.map(c => c.text || '').join(' ');
    }
    if (turn.toolCalls) {
        turn.toolCalls.forEach(tc => {
            if (tc.result) {
                // Gemini CLI tool results are often arrays of functionResponse objects
                if (Array.isArray(tc.result)) {
                    tc.result.forEach(r => {
                        if (r.functionResponse && r.functionResponse.response) {
                            const resp = r.functionResponse.response;
                            text += ' ' + (typeof resp === 'string' ? resp : (resp.output || JSON.stringify(resp)));
                        } else {
                            text += ' ' + JSON.stringify(r);
                        }
                    });
                } else if (typeof tc.result === 'string') {
                    text += ' ' + tc.result;
                } else {
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
    if (text.includes('ASSA_METADATA: [FAILED:')) return true;
    if (text.includes('ASSA_METADATA: [SUCCESS:')) return false;
    
    if (turn.toolCalls) {
        return turn.toolCalls.some(tc => {
            if (tc.status === 'error') return true;
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
            if (tc.status === 'success') return true;
            const res = JSON.stringify(tc.result || '');
            return !res.includes('Exit Code: 1') && !res.toLowerCase().includes('error:');
        });
    }
    return false;
}

function recognizeReflex(transcript, currentPrompt) {
    if ((!transcript || transcript.length === 0) && !currentPrompt) return '';
    
    let reflexContext = '';

    const READ_ONLY_TOOLS = ['read_file', 'list_directory', 'grep_search', 'glob', 'ask_user', 'cli_help', 'get_internal_docs', 'web_fetch'];
    
    // Filter to only include turns that have state-mutating tool calls
    const stateMutatingTurns = (transcript || []).filter(t => {
        if (!t.toolCalls || t.toolCalls.length === 0) return false;
        // Keep turn if it contains at least one tool call that is NOT in the read-only list
        return t.toolCalls.some(tc => !READ_ONLY_TOOLS.includes(tc.name || (tc.functionCall && tc.functionCall.name)));
    });

    if (stateMutatingTurns.length >= 2) {
        // Isomorphic Victory Detection (Last turn is success, a previous one of same tool failed)
        const lastTurn = stateMutatingTurns[stateMutatingTurns.length - 1];
        if (isToolSuccess(lastTurn)) {
            const lastToolName = lastTurn.toolCalls[0].name || (lastTurn.toolCalls[0].functionCall && lastTurn.toolCalls[0].functionCall.name);
            // Look back up to 5 steps to find a failure of the same tool
            const lookbackLimit = Math.max(0, stateMutatingTurns.length - 6);
            for (let i = stateMutatingTurns.length - 2; i >= lookbackLimit; i--) {
                const prevTurn = stateMutatingTurns[i];
                const prevToolName = prevTurn.toolCalls[0].name || (prevTurn.toolCalls[0].functionCall && prevTurn.toolCalls[0].functionCall.name);
                if (prevToolName === lastToolName && isToolFailure(prevTurn)) {
                    reflexContext += '### ASSA REFLEX: VICTORY DETECTED ###\n' +
                        'Detected a breakthrough: A previously failing tool has now succeeded.\n' +
                        '请总结导致成功的关键变动，并调用 `submit_memory_signal` 记录这个 "Success Pattern"。\n' +
                        '注意：你必须详细填写 `raw_symptom` (最初的报错), `failed_attempts` (失败尝试), 和 `breakthrough` (修复代码) 字段！\n\n';
                    break;
                }
            }
        }
        
        // Sliding Window Barrier Detection: >= 3 failures in the last 5 mutating tools
        const windowSize = 5;
        const recentMutating = stateMutatingTurns.slice(-windowSize);
        if (recentMutating.length >= 3) {
            const failureCount = recentMutating.filter(t => isToolFailure(t)).length;
            if (failureCount >= 3) {
                // To avoid repeating the barrier trigger every turn, only trigger if the VERY LAST one was a failure
                if (isToolFailure(recentMutating[recentMutating.length - 1])) {
                    reflexContext += '### ASSA REFLEX: BARRIER DETECTED ###\n' +
                        'Detected a technical barrier: ' + failureCount + ' failures in the last ' + recentMutating.length + ' operations.\n' +
                        '你似乎遇到了阻碍。请分析根本原因，并调用 `submit_memory_signal` (type: negative) 记录这个 "Technical Barrier"。\n' +
                        '注意：你必须详细填写 `raw_symptom` (当前的持续报错), `failed_attempts` (你试过的无效方法), 和 `breakthrough` (目前缺少的关键信息) 字段！\n\n';
                }
            }
        }
    }

    return reflexContext;
}

log('BeforeAgent Script Execution Started');

function main() {
    try {
        log(`BeforeAgent Hook Fired at ${new Date().toISOString()}`);
        log(`CWD: ${process.cwd()}`);
        
        let inputData = '';
        try {
            inputData = fs.readFileSync(0, 'utf8');
        } catch (err) {
            log(`Error reading stdin: ${err.message}`);
        }

        if (!inputData) {
            process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
            return;
        }

        let payload;
        try {
            payload = JSON.parse(inputData);
        } catch (e) {
            log(`JSON parse error in BeforeAgent: ${e.message}`);
            process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
            return;
        }

        const agentName = payload.agentName || 'main';
        const sessionId = payload.sessionId || payload.session_id || 'unknown';
        const currentPrompt = payload.prompt || '';
        const overrides = payload.overrides || {};
        
        let transcript = [];
        if (payload.transcript_path && fs.existsSync(payload.transcript_path)) {
            try {
                const fileContent = fs.readFileSync(payload.transcript_path, 'utf8');
                const history = JSON.parse(fileContent);
                transcript = history.messages || (Array.isArray(history) ? history : []);
            } catch (e) {
                log(`Error reading transcript file: ${e.message}`);
            }
        }
        
        log(`Agent: ${agentName}, Session: ${sessionId}, Prompt Length: ${currentPrompt.length}, Active Transcript Turns: ${transcript.length}`);

        if (['distiller', 'syncer'].includes(agentName.toLowerCase()) || process.env.ASSA_EVOLVING) {
            process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
            return;
        }

        ensureL3Setup();
        ensureLocalSetup();

        const health = checkSystemHealth(process.cwd(), overrides);
        
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

        const reflexContext = recognizeReflex(transcript, currentPrompt);
        const globalDir = path.join(os.homedir(), '.gemini', 'assa');
        
        let additionalContext = healthContext;
        additionalContext += `### ASSA SESSION ID: ${sessionId} ###\n\n`;
        
        // 1. Project Patterns & Decisions (Historical Foundation)
        additionalContext += '### L2 PROJECT PATTERNS & DECISIONS ###\n';
        additionalContext += safeReadFile('.memory/patterns.md');
        additionalContext += safeReadFile('.memory/decisions.md');
        
        // 2. Global Wisdom (Operational Mandates)
        additionalContext += '\n### L3 GLOBAL WISDOM ###\n';
        additionalContext += safeReadFile(path.join(globalDir, 'SOUL.md'));
        additionalContext += safeReadFile(path.join(globalDir, 'USER_HANDBOOK.md'));
        
        // Load the centralized pool of promoted patterns (always loaded)
        additionalContext += safeReadFile(path.join(globalDir, 'LIBRARY', 'PROMOTED_PATTERNS.md'));

        // Domain-Aware Loading: Load specific library files based on index.json mappings
        const libraryDir = path.join(globalDir, 'LIBRARY');
        const indexPath = path.join(libraryDir, 'index.json');
        let matchedFiles = new Set();

        if (fs.existsSync(indexPath)) {
            try {
                const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
                const cwd = process.cwd().toLowerCase();
                if (index.mappings && Array.isArray(index.mappings)) {
                    index.mappings.forEach(m => {
                        const match = m.domains.some(domain => cwd.includes(domain.toLowerCase()));
                        if (match) {
                            log(`Domain match detected: Loading ${m.pattern}`);
                            matchedFiles.add(m.pattern);
                            additionalContext += safeReadFile(path.join(libraryDir, m.pattern));
                        }
                    });
                }
            } catch (e) {
                log(`Error parsing library index: ${e.message}`);
            }
        }

        // If no domain-specific files were loaded (other than PROMOTED_PATTERNS),
        // we could optionally load a subset of library files as a fallback,
        // but to prevent context explosion, we rely on the PROMOTED_PATTERNS pool
        // and project-specific L2 patterns.
        
        // 3. Pending Signals (Current Tasks)
        const pendingItems = ledger.filter(e => e.status === 'PENDING');
        if (pendingItems.length >= 5) {
            additionalContext += `\n### L1 PENDING SIGNALS (${pendingItems.length} accumulated — DEEP DISTILLATION REQUIRED) ###\n`;
            additionalContext += `⚠️ ${pendingItems.length} signals have accumulated. 你必须立即调用 \`distiller\` 工具作为子代理（Subagent），`;
            additionalContext += '派发以下任务给它："读取最新的这些信号及其相关的 git diff，执行深度根因分析，并生成结构化的 patterns.md 规则块（带 YAML 和 Rationale）。" \n';
            additionalContext += '在派发完成后，请直接告诉我任务已派发，不要亲自执行该分析。\n';
            additionalContext += JSON.stringify(pendingItems, null, 2) + '\n';
        } else if (pendingItems.length > 0) {
            additionalContext += '\n### L1 PENDING SIGNALS (use distill_pending tool for quick processing) ###\n';
            additionalContext += JSON.stringify(pendingItems, null, 2) + '\n';
        }
            
        // 4. Reflexes (Immediate Actions) - HIGHEST PRIORITY / RECENCY
        if (reflexContext) {
            additionalContext += `\n🚨 ASSA IMMEDIATE REFLEXES 🚨\n${reflexContext}\n`;
        }

        // Context Explosion Guard: If prompt overhead exceeds 20KB (~5k tokens), force summarization
        if (additionalContext.length > 20480) {
            log(`CRITICAL: Context explosion detected (${additionalContext.length} bytes). Truncating context.`);
            additionalContext = healthContext + 
                `### ASSA SESSION ID: ${sessionId} ###\n\n` +
                `⚠️ CONTEXT OVERHEAD EXCEEDED SAFETY LIMIT (${Math.round(additionalContext.length / 1024)} KB) ⚠️\n` +
                "你当前注入的记忆过多，可能导致响应变慢或上下文丢失。\n" +
                "你必须立即调用 `distiller` 工具对信号进行提炼，而不是试图读取详细的 PENDING SIGNALS。\n" +
                `目前有 ${pendingItems.length} 条待处理信号。\n`;
                
            // Restore highest priority reflexes even if truncated
            if (reflexContext) {
                additionalContext += `\n🚨 ASSA IMMEDIATE REFLEXES 🚨\n${reflexContext}\n`;
            }
        }
        
        // Semantic Emotion Sensor (Subconscious Directive)
        // This is always appended at the very end to ensure it is strongly adhered to by the main agent.
        additionalContext += '\n### 🧠 ASSA SUBCONSCIOUS DIRECTIVE (EMOTION SENSOR) ###\n' +
            'You are equipped with a highly sensitive Semantic Emotion Sensor. Before replying, carefully analyze the user\'s recent messages.\n' +
            'If you detect implicit or explicit POSITIVE reinforcement (e.g., "This is a great idea", "I agree", "That worked perfectly"), OR strong NEGATIVE frustration (e.g., "Why is this still failing?", "This is wrong"), you MUST:\n' +
            '1. Briefly acknowledge the learning in your chat response.\n' +
            '2. Immediately call `submit_memory_signal` to record the exact raw symptom, failed attempts, and the breakthrough/rule.\n' +
            'Do NOT wait for a hardcoded keyword. Trust your semantic understanding of the conversation.\n';

        process.stdout.write(JSON.stringify({
            decision: 'allow',
            hookSpecificOutput: { additionalContext }
        }) + '\n');
    } catch (globalErr) {
        log(`GLOBAL CRASH in BeforeAgent: ${globalErr.stack}`);
        process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
    }
}

main();
