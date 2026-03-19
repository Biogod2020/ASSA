const fs = require('fs');
const path = require('path');
const os = require('os');

const EXTENSION_ROOT = path.dirname(__dirname);
const LOG_PATH = path.join(EXTENSION_ROOT, 'hook_debug.log');
const ledgerUtils = require(path.join(EXTENSION_ROOT, 'skills', 'assa-core', 'scripts', 'ledgerUtils'));
const { checkSystemHealth } = require('./healthCheck');

const NODE_LEVELS = {
    // Global Levels (G) - Library Wisdom
    G0_CORE: 'G0',       // SOUL, HANDBOOK
    G1_FOUNDATION: 'G1', // Universal Standards
    G2_DOMAIN: 'G2',     // Tech Stacks
    G3_FRAGMENT: 'G3',   // Specific utilities, cross-project snippets
    
    // Local Levels (L) - Project Flesh
    L1_OVERRIDE: 'L1',   // Local standard overrides
    L2_SPECIALIST: 'L2', // Project-specific deep knowledge
    L3_TRANSIENT: 'L3'   // Temporary patterns
};

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
    const scriptsDir = path.join(globalDir, 'scripts');
    const templatesDir = path.join(EXTENSION_ROOT, 'templates');
    
    if (!fs.existsSync(libraryDir)) fs.mkdirSync(libraryDir, { recursive: true });
    if (!fs.existsSync(scriptsDir)) fs.mkdirSync(scriptsDir, { recursive: true });

    ['SOUL.md', 'USER_HANDBOOK.md', 'index.json', 'graph.json'].forEach(filename => {
        const src = path.join(templatesDir, filename);
        const dst = path.join(globalDir, filename);
        if (fs.existsSync(src) && !fs.existsSync(dst)) {
            log(`Restoring missing template: ${filename}`);
            fs.copyFileSync(src, dst);
        }
    });

    // Copy scripts
    ['rebuildGraph.js'].forEach(filename => {
        const src = path.join(templatesDir, filename);
        const dst = path.join(scriptsDir, filename);
        // For scripts, we always update to ensure latest version
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dst);
        }
    });
}

function ensureLocalSetup(cwd) {
    const memoryDir = path.resolve(cwd, '.memory');
    if (!fs.existsSync(memoryDir)) {
        log(`Creating missing .memory directory in ${cwd}`);
        fs.mkdirSync(memoryDir, { recursive: true });
    }
    ['patterns.md', 'decisions.md', 'local_habits.md', 'LESSONS_LEARNED.md'].forEach(file => {
        const filePath = path.join(memoryDir, file);
        if (!fs.existsSync(filePath)) {
            log(`Initializing missing local file: ${file} in ${cwd}`);
            fs.writeFileSync(filePath, `# ${file.split('.')[0].replace(/_/g, ' ').toUpperCase()}\n`, 'utf8');
        }
    });
}

function safeReadFile(filepath) {
    if (fs.existsSync(filepath)) return fs.readFileSync(filepath, 'utf8') + '\n';
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
    // Unescape common HTML entities for metadata matching
    return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function resolveGraph(seedIds, graph) {
    const resolved = {
        meat: new Set(),    // Full content needed
        skeleton: new Set() // Only metadata/rationale needed
    };

    if (!graph || !graph.rules) return resolved;

    // V3.5 Hybrid: Only G0 and G1 are Meat by default
    Object.entries(graph.rules).forEach(([id, rule]) => {
        if (rule && (rule.level === NODE_LEVELS.G0_CORE || rule.level === NODE_LEVELS.G1_FOUNDATION)) {
            resolved.meat.add(id);
        } else if (rule) {
            resolved.skeleton.add(id);
        }
    });

    // Seeded rules (matched by domain) should also be Meat
    seedIds.forEach(id => {
        resolved.meat.add(id);
        resolved.skeleton.delete(id);
    });

    return resolved;
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

    // 1. Language-Based Reflex (Correction/Preference/Praise)
    const indicators = {
        correction: ['记得', '应该', '必须', '不要', '规范', '习惯', 'remember', 'must', 'should', 'don\'t', 'standard'],
        praise: ['很好', '棒', 'perfect', 'good job', 'exactly', '不错', '这就对了'],
    };

    if (currentPrompt && indicators.correction.some(word => currentPrompt.toLowerCase().includes(word))) {
        reflexContext += '### ASSA REFLEX: CORRECTION/PREFERENCE DETECTED ###\n' +
            'Explicit user correction or engineering preference detected. You MUST IMMEDIATELY call the `submit_memory_signal` (type: positive) tool to record this preference.\n' +
            'Note: The "Rule" field should describe the general principle, and "Context" should quote the user\'s original intent.\n\n';
    }

    if (currentPrompt && indicators.praise.some(word => currentPrompt.toLowerCase().includes(word))) {
        reflexContext += '### ASSA REFLEX: PRAISE DETECTED ###\n' +
            'Positive reinforcement detected. You MUST IMMEDIATELY backtrack to the preceding successful operation and call `submit_memory_signal` to record this "Success Pattern".\n\n';
    }

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
                        'Breakthrough detected: A previously failing tool has now succeeded. You MUST IMMEDIATELY call `submit_memory_signal` to record this "Success Pattern".\n' +
                        'MANDATORY: Provide "raw_symptom" (original error), "failed_attempts", and "breakthrough" (exact fix).\n\n';
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
                        'Persistent technical barrier detected (' + failureCount + ' failures). You MUST IMMEDIATELY perform a Root Cause Analysis (RCA) and call `submit_memory_signal` (type: negative) to record this "Technical Barrier".\n' +
                        'MANDATORY: Provide detailed logs in "raw_symptom" and summarize what failed.\n\n';
                }
            }
        }
    }

    return reflexContext;
}

function parseLocalPatterns(filepath) {
    const content = safeReadFile(filepath);
    if (!content) return '';

    const blocks = content.split('---').filter(b => b.trim());
    let skeletonOutput = '';

    blocks.forEach(block => {
        const idMatch = block.match(/id: (P-\d{8}-\w+)/);
        const categoryMatch = block.match(/category: (.*)/);
        const statusMatch = block.match(/status: (.*)/);
        const titleMatch = block.match(/^# (.*)$/m);
        const rationaleMatch = block.match(/\*\*Rationale\*\*: (.*)$/m);

        if (idMatch) {
            const id = idMatch[1];
            const title = titleMatch ? titleMatch[1].trim() : 'Untitled Pattern';
            const category = categoryMatch ? categoryMatch[1].trim() : 'General';
            const status = statusMatch ? statusMatch[1].trim() : 'Unknown';
            const rationale = rationaleMatch ? rationaleMatch[1].trim() : 'No rationale provided.';
            
            skeletonOutput += `- **${id}** (${category}): ${title}\n  **Rationale**: ${rationale}\n  **Status**: ${status}\n\n`;
        }
    });

    return skeletonOutput;
}

log('BeforeAgent Script Execution Started');

function main() {
    try {
        log(`BeforeAgent Hook Fired at ${new Date().toISOString()}`);
        
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

        const userPrompt = payload.prompt || '';
        const sessionId = payload.session_id || payload.sessionId || 'unknown';
        const cwd = payload.cwd || process.cwd();

        // --- COMMAND INTERCEPTION (V3.4 Slash Commands) ---
        if (userPrompt.trim().startsWith('/assa promote')) {
            log('SLASH COMMAND DETECTED: /assa promote');
            const promotionContext = '### SYSTEM DIRECTIVE: MANUAL PROMOTION REQUESTED ###\n' +
                'The user has explicitly requested a global promotion. You MUST IMMEDIATELY:\n' +
                '1. Dispatch the `generalist` tool as a sub-agent assigned the **Promoter** persona.\n' +
                '2. Instruct it to perform a full ingestion and synchronize local L2 patterns to the global L3 library according to V3.5 rules (hierarchical, versioned).\n' +
                '3. Report the promotion summary to the user upon completion.\n' +
                'Proceed with execution IMMEDIATELY without further clarification.';
                
            process.stdout.write(JSON.stringify({
                decision: 'allow',
                hookSpecificOutput: { 
                    hookEventName: 'BeforeAgent',
                    additionalContext: promotionContext 
                }
            }) + '\n');
            return;
        }

        const agentName = payload.agentName || 'main';
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
        
        log(`Agent: ${agentName}, Session: ${sessionId}, CWD: ${cwd}, Prompt Length: ${currentPrompt.length}, Active Transcript Turns: ${transcript.length}`);

        if (['distiller', 'syncer'].includes(agentName.toLowerCase()) || process.env.ASSA_EVOLVING) {
            process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
            return;
        }

        ensureL3Setup();
        ensureLocalSetup(cwd);

        const health = checkSystemHealth(cwd, overrides);
        
        let healthContext = '';
        if (health.status !== 'healthy') {
            healthContext = '### ASSA HEALTH WARNING ###\n' +
                '⚠️ Your self-evolution environment has issues:\n' +
                health.warnings.map(w => `- ${w}`).join('\n') + '\n';
            
            if (health.fixSuggestion) {
                healthContext += `💡 Suggestion: ${health.fixSuggestion}\n`;
            }

            if (!health.libraryIncluded && health.fixSuggestion) {
                healthContext += '\n### CRITICAL DIRECTIVE: SELF-HEALING REQUIRED ###\n' +
                    'You currently lack permission to write to the global ASSA library. This will cause subagents to fail.\n' +
                    'You MUST IMMEDIATELY call `run_shell_command` with the following fix command:\n' +
                    health.fixSuggestion.split(': ')[1] + '\n' +
                    'Proceed with the fix before answering any user questions.\n';
            }

            healthContext += 'Please resolve these to ensure ASSA can continue to evolve.\n\n';
        }

        let ledger;
        try {
            ledger = ledgerUtils.updateLedger((l) => {
                const { ledger: updatedLedger, changed } = cascadeRewound(l, transcript, sessionId);
                return updatedLedger;
            }, cwd);
        } catch (e) {
            ledger = ledgerUtils.loadLedger(cwd);
        }

        const reflexContext = recognizeReflex(transcript, currentPrompt);
        const globalDir = path.join(os.homedir(), '.gemini', 'assa');
        
        let additionalContext = healthContext;
        additionalContext += `### ASSA SESSION ID: ${sessionId} ###\n\n`;
        
        // 1. Project Patterns & Decisions (Historical Foundation)
        additionalContext += '### L2 PROJECT PATTERNS & DECISIONS ###\n';
        additionalContext += parseLocalPatterns(path.join(cwd, '.memory/patterns.md'));
        additionalContext += safeReadFile(path.join(cwd, '.memory/decisions.md'));
        
        // 2. Global Wisdom (Operational Mandates)
        additionalContext += '\n### L3 GLOBAL WISDOM ###\n';
        additionalContext += safeReadFile(path.join(globalDir, 'SOUL.md'));
        additionalContext += safeReadFile(path.join(globalDir, 'USER_HANDBOOK.md'));
        
        // Domain-Aware Graph Loading (V3.4 Skeleton Strategy)
        const libraryDir = path.join(globalDir, 'LIBRARY');
        const graphPath = path.join(globalDir, 'graph.json');
        const indexPath = path.join(libraryDir, 'index.json');
        
        let graph = { rules: {} };
        if (fs.existsSync(graphPath)) {
            try { 
                const graphContent = fs.readFileSync(graphPath, 'utf8');
                if (graphContent.trim()) {
                    graph = JSON.parse(graphContent); 
                }
            } catch(e) { 
                log(`Graph parse error: ${e.message}`); 
            }
        }

        let seedIds = new Set();
        if (fs.existsSync(indexPath)) {
            try {
                const indexContent = fs.readFileSync(indexPath, 'utf8');
                if (indexContent.trim()) {
                    const index = JSON.parse(indexContent);
                    const currentCwd = cwd.toLowerCase();
                    if (index.mappings && Array.isArray(index.mappings)) {
                        index.mappings.forEach(m => {
                            if (!m.domains) return;
                            const match = m.domains.some(domain => currentCwd.includes(domain.toLowerCase()));
                            if (match) {
                                log(`Seed match detected: ${m.rule_id || m.pattern}`);
                                if (m.rule_id) seedIds.add(m.rule_id);
                            }
                        });
                    }
                }
            } catch (e) { 
                log(`Index parse error: ${e.message}`); 
            }
        }

        const resolved = resolveGraph(Array.from(seedIds), graph);

        additionalContext += '\n### L3 KNOWLEDGE GRAPH (Active Meat) ###\n';
        resolved.meat.forEach(id => {
            const rule = graph.rules[id];
            if (rule && rule.path) {
                additionalContext += `\n#### RULE: ${id}\n`;
                additionalContext += safeReadFile(path.join(globalDir, rule.path));
            }
        });

        if (resolved.skeleton.size > 0) {
            additionalContext += '\n### L3 KNOWLEDGE GRAPH (Background Skeleton) ###\n';
            resolved.skeleton.forEach(id => {
                const rule = graph.rules[id];
                if (rule) {
                    const title = rule.title || 'Untitled Rule';
                    const triggers = rule.triggers ? ` Triggers: [${rule.triggers.join(', ')}]` : '';
                    additionalContext += `- **${id}** (${title}): ${rule.rationale || 'No rationale.'}${triggers} (Path: ${rule.path})\n`;
                }
            });
        }

        // --- ARCHITECTURAL SENSITIVITY MANDATE ---
        additionalContext += '\n### 🚨 ARCHITECTURAL SENSITIVITY MANDATE 🚨 ###\n' +
            'You are operating in **Index-Aware Mode**. The index above lists critical architectural rules (G2/L2).\n' +
            '**MANDATORY**: If your current task involves any keywords found in the [Triggers] or [Rationale] of a rule, you MUST use `read_file` to fetch its full content BEFORE proposing any code changes. Do NOT guess the implementation details from the summary.\n';


        // If no domain-specific files were loaded (other than PROMOTED_PATTERNS),
        // we could optionally load a subset of library files as a fallback,
        // but to prevent context explosion, we rely on the PROMOTED_PATTERNS pool
        // and project-specific L2 patterns.
        
        // 3. Pending Signals (Current Tasks)
        const pendingItems = ledger.filter(e => e.status === 'PENDING');
        if (pendingItems.length >= 5) {
            additionalContext += `\n### L1 PENDING SIGNALS (${pendingItems.length} accumulated — DEEP DISTILLATION REQUIRED) ###\n`;
            additionalContext += `⚠️ ${pendingItems.length} signals have accumulated. You MUST IMMEDIATELY dispatch the \`distiller\` sub-agent (via the \`generalist\` tool) `;
            additionalContext += 'with the following task: "Read these latest signals and their associated git diffs, perform a Deep Root Cause Analysis, and generate structured patterns.md rule blocks (including YAML frontmatter and Rationale)." \n';
            additionalContext += 'Directly report that the task has been dispatched—do not attempt to perform the analysis yourself.\n';
            additionalContext += JSON.stringify(pendingItems, null, 2) + '\n';
        } else if (pendingItems.length > 0) {
            additionalContext += '\n### L1 PENDING SIGNALS (use distill_pending tool for quick processing) ###\n';
            additionalContext += JSON.stringify(pendingItems, null, 2) + '\n';
        }

        // Context Explosion Guard: If prompt overhead exceeds 20KB (~5k tokens), prepend a warning
        if (additionalContext.length > 20480) {
            log(`CRITICAL: Context overhead detected (${additionalContext.length} bytes). Prepending warning.`);
            const warning = `\n⚠️ CONTEXT OVERHEAD EXCEEDED SAFETY LIMIT (${Math.round(additionalContext.length / 1024)} KB) ⚠️\n` +
                "The amount of injected memory context is excessive, which may lead to slower responses or loss of context. Please maintain task atomicity and consider timely distillation.\n";
            additionalContext = warning + additionalContext;
        }
        
        // 4. Final Directive Layer (Recency Effect - HIGHEST WEIGHT)
        
        // Semantic Emotion Sensor (Subconscious Directive)
        additionalContext += '\n### 🧠 ASSA SUBCONSCIOUS DIRECTIVE (EMOTION SENSOR) ###\n' +
            'You are equipped with a highly sensitive Semantic Emotion Sensor. Before replying, carefully analyze the user\'s recent messages.\n' +
            'If you detect implicit or explicit POSITIVE reinforcement (e.g., "This is a great idea", "I agree", "That worked perfectly"), OR strong NEGATIVE frustration (e.g., "Why is this still failing?", "This is wrong"), you MUST:\n' +
            '1. Briefly acknowledge the learning in your chat response.\n' +
            '2. Immediately call `submit_memory_signal` to record the exact raw symptom, failed attempts, and the breakthrough/rule.\n' +
            '3. **Internal Memory Judgment**: Proactively submit signals for your own breakthroughs even if the user doesn\'t explicitly praise them.\n' +
            '4. **Traceability**: When applying an established rule, briefly cite its Rule ID (e.g., [Rule: G1_CORE]) to maintain the evolution chain.\n' +
            'Do NOT wait for a hardcoded keyword. Trust your semantic understanding of the conversation.\n';

        // Mandatory Heartbeat for Continuous Distillation (Rule: G1_CORE_CONTINUOUS_DISTILLATION)
        additionalContext += '\n### MANDATORY NEXT STEP: CONTINUOUS DISTILLATION ###\n' +
            '1. **ANALYZE DELTA**: Analyze the delta between previous turns and current intent. Call `submit_memory_signal` to persist realizations.\n' +
            '2. **REDUNDANCY CHECK**: If you discover a pattern that is REDUNDANT, DUPLICATE, or CONFLICTING with an existing rule in the index, you MUST read the involved entries and ask the user for consolidation advice BEFORE proceeding.\n' +
            'This is a MANDATORY HEARTBEAT; do not skip it.\n';

        if (reflexContext) {
            additionalContext += `\n🚨 ASSA REFLEX ALERT 🚨\n${reflexContext}\n`;
        }

        process.stdout.write(JSON.stringify({
            decision: 'allow',
            hookSpecificOutput: { 
                hookEventName: 'BeforeAgent',
                additionalContext 
            }
        }) + '\n');
    } catch (globalErr) {
        log(`GLOBAL CRASH in BeforeAgent: ${globalErr.stack}`);
        process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
    }
}

main();
