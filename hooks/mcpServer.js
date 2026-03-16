const fs = require('fs');
const path = require('path');
const readline = require('readline');
const ledgerUtils = require('../skills/assa-core/scripts/ledgerUtils');
const { checkSystemHealth } = require('./healthCheck');

const LOG_PATH = path.join(__dirname, '..', 'mcp_debug.log');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

function log(msg) {
    fs.appendFileSync(LOG_PATH, msg + '\n');
}

rl.on('line', (line) => {
    try {
        if (!line.trim()) return;
        const request = JSON.parse(line);
        log('Received: ' + line);

        // Handle Notifications (No ID)
        if (request.id === undefined || request.id === null) {
            if (request.method === 'notifications/initialized' || request.method === 'initialized') {
                log('MCP Client Initialized.');
            } else if (request.method === 'notifications/roots/list_changed') {
                log('Roots changed notification received.');
            } else {
                log(`Unhandled notification: ${request.method}`);
            }
            return;
        }

        // Handle Requests (Must have ID)
        if (request.method === 'initialize') {
            const response = {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {} },
                    serverInfo: { name: 'assa-mcp', version: '2.0.0' }
                }
            };
            process.stdout.write(JSON.stringify(response) + '\n');
            log('Sent Initialize response');

        } else if (request.method === 'ping') {
            const response = {
                jsonrpc: '2.0',
                id: request.id,
                result: {}
            };
            process.stdout.write(JSON.stringify(response) + '\n');
            log('Sent Ping response');

        } else if (request.method === 'tools/list' || request.method === 'list_tools') {
            const response = {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    tools: [
                        {
                            name: 'submit_memory_signal',
                            description: 'Submits a semantic memory realization to the local ledger.',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    type: { enum: ['positive', 'negative'], description: 'Type of feedback', default: 'positive' },
                                    rule: { type: 'string', description: 'The actionable rule/lesson' },
                                    context: { type: 'string', description: 'Why this was learned' },
                                    tags: { type: 'array', items: { type: 'string' } },
                                    session_id: { type: 'string', description: 'The current active sessionId' }
                                },
                                required: ['rule']
                            }
                        },
                        {
                            name: 'distill_pending',
                            description: 'Distills all PENDING ledger signals into patterns.md. This is a pure function—no LLM needed. Call this when you see PENDING items in L1 context.',
                            inputSchema: {
                                type: 'object',
                                properties: {},
                                required: []
                            }
                        },
                        {
                            name: 'request_global_promotion',
                            description: 'Promotes mature L2 patterns to the global L3 library. Call after git push or when patterns have high confidence.',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    topic: { type: 'string', description: 'The topic to promote, or "all"' }
                                }
                            }
                        },
                        {
                            name: 'mark_processed_signals',
                            description: 'Marks specific message IDs in the ledger as PROCESSED.',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    message_ids: { type: 'array', items: { type: 'string' }, description: 'IDs to mark' }
                                },
                                required: ['message_ids']
                            }
                        },
                        {
                            name: 'check_health',
                            description: 'Performs a comprehensive health check of the ASSA environment.',
                            inputSchema: {
                                type: 'object',
                                properties: {},
                                required: []
                            }
                        }
                    ]
                }
            };
            process.stdout.write(JSON.stringify(response) + '\n');
            log('Sent Tools List');

        } else if (request.method === 'tools/call' || request.method === 'call_tool') {
            const { name, arguments: args } = request.params;
            log(`Calling tool: ${name}`);
            
            let resultText = '';
            if (name === 'submit_memory_signal') {
                const recordId = 'mcp-' + Date.now();
                ledgerUtils.updateLedger((ledger) => {
                    const record = {
                        session_id: args.session_id || 'unknown',
                        message_id: recordId,
                        timestamp: new Date().toISOString(),
                        status: 'PENDING',
                        type: args.type || 'positive',
                        payload: {
                            rule: args.rule || '',
                            context: args.context || '',
                            tags: args.tags || []
                        },
                        git_anchor: ''
                    };
                    ledger.push(record);
                    return ledger;
                });
                resultText = `Signal appended to ledger as PENDING (id: ${recordId})`;

            } else if (name === 'distill_pending') {
                let pendingItems = [];
                ledgerUtils.updateLedger((ledger) => {
                    pendingItems = ledger.filter(e => e.status === 'PENDING');
                    if (pendingItems.length > 0) {
                        pendingItems.forEach(e => e.status = 'PROCESSED');
                    }
                    return ledger.filter(e => e.status !== 'REWOUND');
                });
                
                if (pendingItems.length === 0) {
                    resultText = 'No pending signals to distill.';
                } else {
                    const patternsPath = path.resolve(process.cwd(), '.memory/patterns.md');
                    let patterns = '# PATTERNS\n';
                    if (fs.existsSync(patternsPath)) {
                        patterns = fs.readFileSync(patternsPath, 'utf8');
                    }
                    const newPatterns = pendingItems.map(item => {
                        const tags = item.payload.tags ? item.payload.tags.join('/') : 'general';
                        return `- **${tags}**: ${item.payload.rule} (from ${item.message_id})`;
                    });
                    patterns = patterns.trimEnd() + '\n' + newPatterns.join('\n') + '\n';
                    fs.writeFileSync(patternsPath, patterns, 'utf8');
                    resultText = `Distilled ${pendingItems.length} signals into patterns.md and marked as PROCESSED.\nNew patterns:\n${newPatterns.join('\n')}`;
                }

            } else if (name === 'request_global_promotion') {
                const os = require('os');
                const topic = args.topic || 'all';
                const patternsPath = path.resolve(process.cwd(), '.memory/patterns.md');
                const globalLibDir = path.join(os.homedir(), '.gemini', 'assa', 'LIBRARY');
                if (!fs.existsSync(globalLibDir)) fs.mkdirSync(globalLibDir, { recursive: true });
                
                let promoted = 0;
                if (fs.existsSync(patternsPath)) {
                    const patterns = fs.readFileSync(patternsPath, 'utf8');
                    const globalFile = path.join(globalLibDir, 'PROMOTED_PATTERNS.md');
                    let existing = fs.existsSync(globalFile) ? fs.readFileSync(globalFile, 'utf8') : '# PROMOTED PATTERNS (L3 Global)\n';
                    const lines = patterns.split('\n').filter(l => l.startsWith('- **'));
                    const newLines = lines.filter(l => !existing.includes(l));
                    if (newLines.length > 0) {
                        existing = existing.trimEnd() + '\n' + newLines.join('\n') + '\n';
                        fs.writeFileSync(globalFile, existing, 'utf8');
                        promoted = newLines.length;
                    }
                }
                resultText = `Promoted ${promoted} patterns to L3 Global Library.`;

            } else if (name === 'mark_processed_signals') {
                const messageIds = args.message_ids || [];
                ledgerUtils.markProcessed(messageIds);
                resultText = `Marked ${messageIds.length} signals as PROCESSED`;

            } else if (name === 'check_health') {
                const health = checkSystemHealth();
                resultText = JSON.stringify(health, null, 2);
            }

            const response = {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    content: [{ type: 'text', text: resultText }]
                }
            };
            process.stdout.write(JSON.stringify(response) + '\n');
            log(`Sent result for ${name}`);

        } else {
            // Unknown Method: return error
            const response = {
                jsonrpc: '2.0',
                id: request.id,
                error: {
                    code: -32601,
                    message: `Method not found: ${request.method}`
                }
            };
            process.stdout.write(JSON.stringify(response) + '\n');
            log(`Sent Method Not Found error for ${request.method}`);
        }
    } catch (err) {
        log('Fatal Error: ' + err.stack);
        // If it was a request, try to send an error response so client doesn't hang
        try {
            const request = JSON.parse(line);
            if (request && request.id !== undefined) {
                const response = {
                    jsonrpc: '2.0',
                    id: request.id,
                    error: {
                        code: -32603,
                        message: `Internal error: ${err.message}`
                    }
                };
                process.stdout.write(JSON.stringify(response) + '\n');
            }
        } catch (e) {}
    }
});
