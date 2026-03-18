import fs from 'fs';
import path from 'path';
import os from 'os';
import { LedgerManager } from './ledger';
import { checkSystemHealth } from './healthCheck';
import { BeforeAgentInput, BeforeAgentOutput } from './hookTypes';

/**
 * ASSA BeforeAgent Hook
 * Manages context injection and evolutionary state.
 * Aligned with official Gemini CLI Hook definitions.
 */

function ensureL3Setup(extensionPath: string): void {
  const globalDir = path.join(os.homedir(), '.gemini', 'assa');
  const libraryDir = path.join(globalDir, 'LIBRARY');
  const templatesDir = path.join(extensionPath, 'templates');

  if (!fs.existsSync(libraryDir)) {
    fs.mkdirSync(libraryDir, { recursive: true });
  }

  ['SOUL.md', 'USER_HANDBOOK.md', 'index.json'].forEach((filename) => {
    const src = path.join(templatesDir, filename);
    const dst = path.join(globalDir, filename);
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      fs.copyFileSync(src, dst);
    }
  });
}

function ensureLocalSetup(workspaceRoot: string): void {
  const memoryDir = path.resolve(workspaceRoot, '.memory');
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }
  [
    'patterns.md',
    'decisions.md',
    'local_habits.md',
    'LESSONS_LEARNED.md',
  ].forEach((file) => {
    const filePath = path.join(memoryDir, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(
        filePath,
        `# ${file.split('.')[0].replace(/_/g, ' ').toUpperCase()}\n`,
        'utf8',
      );
    }
  });
}

/**
 * Keywords to trigger semantic reflection
 */
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
  'very good',
  'nice',
  'exactly',
  'correct',
  'suggest',
  'like',
  'habit',
  'should',
  'remember',
];

function detectReflectionOpportunity(prompt: string): string {
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

function safeReadFile(filepath: string): string {
  if (fs.existsSync(filepath)) return fs.readFileSync(filepath, 'utf8') + '\n';
  return '';
}

/**
 * Extract all text content from a transcript turn, including tool calls and results.
 */
function extractAllText(turn: any): string {
  let text = turn.content || '';
  if (Array.isArray(text)) {
    text = text.map((c: any) => c.text || '').join(' ');
  }
  if (turn.toolCalls) {
    turn.toolCalls.forEach((tc: any) => {
      if (tc.result) {
        if (Array.isArray(tc.result)) {
          tc.result.forEach((r: any) => {
            if (r.functionResponse && r.functionResponse.response) {
              const resp = r.functionResponse.response;
              text +=
                ' ' +
                (typeof resp === 'string'
                  ? resp
                  : resp.output || JSON.stringify(resp));
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

export async function main() {
  // Redirect logs to stderr to keep stdout pure for CLI JSON communication
  console.log = console.error;
  console.warn = console.error;

  try {
    const inputData = fs.readFileSync(0, 'utf8');
    if (!inputData) return;

    const input: BeforeAgentInput = JSON.parse(inputData);
    const { cwd, transcript_path } = input;
    const userPrompt = input.prompt || '';
    const session_id = input.session_id || input.sessionId || 'unknown';
    const agent_name = input.agent_name || input.agentName || 'main';

    // Bypass for evolution subagents (distiller, syncer, etc.) or explicit evolution flag
    const isEvolutionSubagent =
      agent_name &&
      ['distiller', 'syncer', 'skill_generator'].includes(
        agent_name.toLowerCase(),
      );

    if (process.env.ASSA_EVOLVING || isEvolutionSubagent) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
      return;
    }

    let transcript: any[] = [];
    if (transcript_path && fs.existsSync(transcript_path)) {
      try {
        const fileContent = fs.readFileSync(transcript_path, 'utf8');
        const history = JSON.parse(fileContent);
        transcript =
          history.messages || (Array.isArray(history) ? history : []);
      } catch (e) {
        // Silently catch transcript errors
      }
    }

    ensureLocalSetup(cwd);

    const ledgerManager = new LedgerManager(cwd);

    // Cascade Rewound Status
    await ledgerManager.updateStatus((ledger) => {
      let allTranscriptContent = '';
      transcript.forEach((turn) => {
        allTranscriptContent += (turn.id || '') + ' ';
        allTranscriptContent += extractAllText(turn) + ' ';
      });

      ledger.forEach((entry) => {
        if (entry.session_id === session_id) {
          const isPresent = allTranscriptContent.includes(entry.message_id);
          if (
            (entry.status === 'PENDING' || entry.status === 'PROCESSED') &&
            !isPresent
          ) {
            entry.status = 'REWOUND';
          } else if (entry.status === 'REWOUND' && isPresent) {
            entry.status = 'PENDING';
          }
        }
      });
    });

    const health = checkSystemHealth(cwd);
    const reflexContext = detectReflectionOpportunity(userPrompt);
    const globalDir = path.join(os.homedir(), '.gemini', 'assa');

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
    additionalContext += safeReadFile(path.join(cwd, '.memory/patterns.md'));
    additionalContext += safeReadFile(path.join(cwd, '.memory/decisions.md'));

    additionalContext += '\n### L3 GLOBAL WISDOM ###\n';
    additionalContext += safeReadFile(path.join(globalDir, 'SOUL.md'));
    additionalContext += safeReadFile(path.join(globalDir, 'USER_HANDBOOK.md'));

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
        'You have injected too many memories, which may cause slow responses or context loss.\n' +
        'You MUST immediately invoke the `distiller` tool to distill signals into patterns.md, ' +
        'instead of attempting to read detailed PENDING SIGNALS.\n' +
        `There are currently ${pendingItems.length} pending signals.\n`;
    }

    const output: BeforeAgentOutput = {
      decision: 'allow',
      hookSpecificOutput: {
        hookEventName: 'BeforeAgent',
        additionalContext,
      },
    };

    process.stdout.write(JSON.stringify(output) + '\n');
  } catch (err: any) {
    console.error('[ASSA Fatal] BeforeAgent Hook Error:', err.message);
    process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}
