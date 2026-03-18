"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssaMcpServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const ledger_1 = require("./ledger");
const path_1 = __importDefault(require("path"));
/**
 * ASSA MCP Server Implementation
 * strictly follows Gemini CLI contributing guidelines.
 */
class AssaMcpServer {
    server;
    ledgerManager;
    constructor() {
        this.server = new index_js_1.Server({
            name: 'assa-mcp',
            version: '3.2.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.ledgerManager = new ledger_1.LedgerManager(process.cwd());
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'submit_memory_signal',
                    description: 'Submits a semantic memory realization to the local ledger.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            type: {
                                type: 'string',
                                enum: ['positive', 'negative', 'breakthrough', 'barrier'],
                                description: 'Type of feedback',
                                default: 'positive',
                            },
                            rule: {
                                type: 'string',
                                description: 'The actionable rule/lesson',
                            },
                            context: {
                                type: 'string',
                                description: 'Why this was learned',
                            },
                            tags: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                            session_id: {
                                type: 'string',
                                description: 'The current active sessionId',
                            },
                        },
                        required: ['rule'],
                    },
                },
                {
                    name: 'distill_pending',
                    description: 'Distills all PENDING ledger signals into patterns.md. Pure function.',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
                {
                    name: 'request_global_promotion',
                    description: 'Requests promotion of L2 patterns to L3 Global Library.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            topic: {
                                type: 'string',
                                description: 'Domain/topic to focus on (e.g., ARCHITECTURE)',
                            },
                        },
                    },
                },
                {
                    name: 'mark_processed_signals',
                    description: 'Marks specific message IDs in the ledger as PROCESSED.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            message_ids: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'IDs to mark',
                            },
                        },
                        required: ['message_ids'],
                    },
                },
            ],
        }));
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'submit_memory_signal': {
                        const rule = String(args?.rule);
                        const context = String(args?.context || '');
                        const type = args?.type || 'positive';
                        const tags = Array.isArray(args?.tags) ? args.tags : [];
                        const sessionId = String(args?.session_id || 'unknown');
                        const record = this.ledgerManager.addSignal({
                            session_id: sessionId,
                            message_id: `mcp-${Date.now()}`,
                            type,
                            payload: { rule, context, tags },
                        });
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Signal appended to ledger as PENDING (id: ${record.message_id})`,
                                },
                            ],
                        };
                    }
                    case 'distill_pending': {
                        const patternsPath = path_1.default.join(process.cwd(), '.memory', 'patterns.md');
                        const result = this.ledgerManager.distillPending(patternsPath);
                        return {
                            content: [{ type: 'text', text: result }],
                        };
                    }
                    case 'request_global_promotion': {
                        const topic = String(args?.topic || 'all');
                        const resultText = `GLOBAL PROMOTION REQUESTED [Topic: ${topic}].\n` +
                            `Dispatch task to **ASSA Syncer** via \`generalist\` tool.\n` +
                            `Task: Promote mature L2 patterns to L3 for domain: ${topic}.`;
                        return {
                            content: [{ type: 'text', text: resultText }],
                        };
                    }
                    case 'mark_processed_signals': {
                        const messageIds = args?.message_ids || [];
                        this.ledgerManager.markProcessed(messageIds);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Marked ${messageIds.length} signals as PROCESSED`,
                                },
                            ],
                        };
                    }
                    default:
                        throw new Error(`Tool not found: ${name}`);
                }
            }
            catch (error) {
                return {
                    content: [{ type: 'text', text: `Error: ${error.message}` }],
                    isError: true,
                };
            }
        });
    }
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error('ASSA MCP Server running on stdio');
    }
}
exports.AssaMcpServer = AssaMcpServer;
// In CommonJS (default node behavior for our config), we can use require.main === module
if (typeof require !== 'undefined' && require.main === module) {
    const server = new AssaMcpServer();
    server.run().catch((error) => {
        console.error('Fatal error running server:', error);
        process.exit(1);
    });
}
