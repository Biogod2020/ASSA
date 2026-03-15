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
        const request = JSON.parse(line);
        log('Received: ' + line);

        if (request.method === 'tools/list' || request.method === 'list_tools') {
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
                                    tags: { type: 'array', items: { type: 'string' } }
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

        } else if (request.method === 'tools/call' || request.method === 'call_tool') {
            const { name, arguments: args } = request.params;
            
            if (name === 'submit_memory_signal') {
                const recordId = 'mcp-' + Date.now();
                ledgerUtils.updateLedger((ledger) => {
                    const record = {
                        session_id: 'unknown',
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
                
                const response = {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        content: [{ type: 'text', text: `Signal appended to ledger as PENDING (id: ${recordId})` }]
                    }
                };
                process.stdout.write(JSON.stringify(response) + '\n');

            } else if (name === 'distill_pending') {
                // Pure function: read pending signals, append to patterns.md, mark processed
                let pendingItems = [];
                ledgerUtils.updateLedger((ledger) => {
                    pendingItems = ledger.filter(e => e.status === 'PENDING');
                    if (pendingItems.length > 0) {
                        pendingItems.forEach(e => e.status = 'PROCESSED');
                    }
                    // Clean up REWOUND signals to keep the ledger size manageable
                    return ledger.filter(e => e.status !== 'REWOUND');
                });
                
                if (pendingItems.length === 0) {
                    const response = {
                        jsonrpc: '2.0',
                        id: request.id,
                        result: {
                            content: [{ type: 'text', text: 'No pending signals to distill.' }]
                        }
                    };
                    process.stdout.write(JSON.stringify(response) + '\n');
                    return;
                }

                // Read existing patterns
                const patternsPath = path.resolve(process.cwd(), '.memory/patterns.md');
                let patterns = '# PATTERNS\n';
                if (fs.existsSync(patternsPath)) {
                    patterns = fs.readFileSync(patternsPath, 'utf8');
                }

                // Append new patterns from pending signals
                const newPatterns = pendingItems.map(item => {
                    const tags = item.payload.tags ? item.payload.tags.join('/') : 'general';
                    return `- **${tags}**: ${item.payload.rule} (from ${item.message_id})`;
                });
                
                patterns = patterns.trimEnd() + '\n' + newPatterns.join('\n') + '\n';
                fs.writeFileSync(patternsPath, patterns, 'utf8');

                log(`Distilled ${pendingItems.length} signals into patterns.md`);

                const response = {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        content: [{ type: 'text', text: `Distilled ${pendingItems.length} signals into patterns.md and marked as PROCESSED.\nNew patterns:\n${newPatterns.join('\n')}` }]
                    }
                };
                process.stdout.write(JSON.stringify(response) + '\n');

            } else if (name === 'request_global_promotion') {
                // Read L2 patterns and copy relevant ones to L3 LIBRARY
                const os = require('os');
                const topic = args.topic || 'all';
                const patternsPath = path.resolve(process.cwd(), '.memory/patterns.md');
                const globalLibDir = path.join(os.homedir(), '.gemini', 'assa', 'LIBRARY');
                
                if (!fs.existsSync(globalLibDir)) {
                    fs.mkdirSync(globalLibDir, { recursive: true });
                }
                
                let promoted = 0;
                if (fs.existsSync(patternsPath)) {
                    const patterns = fs.readFileSync(patternsPath, 'utf8');
                    const globalFile = path.join(globalLibDir, 'PROMOTED_PATTERNS.md');
                    let existing = '';
                    if (fs.existsSync(globalFile)) {
                        existing = fs.readFileSync(globalFile, 'utf8');
                    } else {
                        existing = '# PROMOTED PATTERNS (L3 Global)\n';
                    }
                    // Append L2 patterns not already in L3
                    const lines = patterns.split('\n').filter(l => l.startsWith('- **'));
                    const newLines = lines.filter(l => !existing.includes(l));
                    if (newLines.length > 0) {
                        existing = existing.trimEnd() + '\n' + newLines.join('\n') + '\n';
                        fs.writeFileSync(globalFile, existing, 'utf8');
                        promoted = newLines.length;
                    }
                }

                log(`Promoted ${promoted} patterns to L3 for topic: ${topic}`);

                const response = {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        content: [{ type: 'text', text: `Promoted ${promoted} patterns to L3 Global Library.` }]
                    }
                };
                process.stdout.write(JSON.stringify(response) + '\n');

            } else if (name === 'mark_processed_signals') {
                const messageIds = args.message_ids || [];
                ledgerUtils.markProcessed(messageIds);
                
                const response = {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        content: [{ type: 'text', text: `Marked ${messageIds.length} signals as PROCESSED` }]
                    }
                };
                process.stdout.write(JSON.stringify(response) + '\n');

            } else if (name === 'check_health') {
                const health = checkSystemHealth();
                const response = {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        content: [{ type: 'text', text: JSON.stringify(health, null, 2) }]
                    }
                };
                process.stdout.write(JSON.stringify(response) + '\n');
            }

        } else if (request.method === 'initialize') {
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
        } else if (request.method === 'notifications/initialized') {
            // No response needed
        }
    } catch (err) {
        log('Error: ' + err.message);
    }
});
