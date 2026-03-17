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

export async function main() {
  try {
    const inputData = fs.readFileSync(0, 'utf8');
    if (!inputData) return;

    const input: BeforeAgentInput = JSON.parse(inputData);
    const { session_id, prompt, cwd } = input;

    // Bypass for evolution subagents (if they set this env)
    if (process.env.ASSA_EVOLVING) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
      return;
    }

    ensureLocalSetup(cwd);

    // DIAGNOSTIC LOGGING
    const debugDir = path.join(cwd, '.memory', 'debug');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    fs.writeFileSync(
      path.join(debugDir, `beforeAgent_${Date.now()}.json`),
      JSON.stringify({ input, env: { ASSA_EVOLVING: process.env.ASSA_EVOLVING } }, null, 2),
    );

    const ledgerManager = new LedgerManager(cwd);
    const health = checkSystemHealth(cwd);
    const reflexContext = detectReflectionOpportunity(prompt);
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
        'Invoke `distiller` to distill signals.\n';
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
    const debugDir = path.join(process.cwd(), '.memory', 'debug');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    fs.writeFileSync(path.join(debugDir, `error_${Date.now()}.txt`), err.stack || err.message);
    process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}
