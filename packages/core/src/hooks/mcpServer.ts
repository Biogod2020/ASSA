import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { LedgerManager } from './ledger';
import { SignalType } from './types';
import path from 'path';

/**
 * ASSA MCP Server Implementation
 * strictly follows Gemini CLI contributing guidelines.
 */
export class AssaMcpServer {
  private server: Server;
  private ledgerManager: LedgerManager;

  constructor() {
    this.server = new Server(
      {
        name: 'assa-mcp',
        version: '3.2.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.ledgerManager = new LedgerManager(process.cwd());
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'submit_memory_signal',
          description:
            'Submits a semantic memory realization to the local ledger.',
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
          description:
            'Distills all PENDING ledger signals into patterns.md. Pure function.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'request_global_promotion',
          description:
            'Requests promotion of L2 patterns to L3 Global Library.',
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

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'submit_memory_signal': {
            const rule = String(args?.rule);
            const context = String(args?.context || '');
            const type = (args?.type as SignalType) || 'positive';
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
            const patternsPath = path.join(
              process.cwd(),
              '.memory',
              'patterns.md',
            );
            const result = this.ledgerManager.distillPending(patternsPath);
            return {
              content: [{ type: 'text', text: result }],
            };
          }

          case 'request_global_promotion': {
            const topic = String(args?.topic || 'all');
            const resultText =
              `GLOBAL PROMOTION REQUESTED [Topic: ${topic}].\n` +
              `Dispatch task to **ASSA Syncer** via \`generalist\` tool.\n` +
              `Task: Promote mature L2 patterns to L3 for domain: ${topic}.`;
            return {
              content: [{ type: 'text', text: resultText }],
            };
          }

          case 'mark_processed_signals': {
            const messageIds = (args?.message_ids as string[]) || [];
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
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ASSA MCP Server running on stdio');
  }
}

// In CommonJS (default node behavior for our config), we can use require.main === module
if (typeof require !== 'undefined' && require.main === module) {
  const server = new AssaMcpServer();
  server.run().catch((error) => {
    console.error('Fatal error running server:', error);
    process.exit(1);
  });
}
