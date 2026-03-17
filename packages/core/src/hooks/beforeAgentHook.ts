import fs from 'fs';
import path from 'path';
import os from 'os';
import { LedgerManager } from './ledger';
import { checkSystemHealth } from './healthCheck';
import { SignalRecord } from './types';

/**
 * ASSA BeforeAgent Hook
 * Manages context injection and evolutionary state.
 */

interface TranscriptTurn {
  id?: string;
  type: 'user' | 'agent';
  content?: string | any[];
  toolCalls?: Array<{
    name: string;
    status: 'success' | 'error';
    result?: any;
    resultDisplay?: string;
  }>;
}

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

function ensureLocalSetup(): void {
  const memoryDir = path.resolve(process.cwd(), '.memory');
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }
  ['patterns.md', 'decisions.md', 'local_habits.md', 'LESSONS_LEARNED.md'].forEach(
    (file) => {
      const filePath = path.join(memoryDir, file);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(
          filePath,
          `# ${file.split('.')[0].replace(/_/g, ' ').toUpperCase()}\n`,
          'utf8'
        );
      }
    }
  );
}

function extractAllText(turn: TranscriptTurn): string {
  let text = '';
  if (typeof turn.content === 'string') {
    text += turn.content;
  } else if (Array.isArray(turn.content)) {
    text += turn.content.map((c: any) => c.text || '').join(' ');
  }

  if (turn.toolCalls) {
    turn.toolCalls.forEach((tc) => {
      if (tc.result) {
        if (Array.isArray(tc.result)) {
          tc.result.forEach((r: any) => {
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

function isToolFailure(turn: TranscriptTurn): boolean {
  const text = extractAllText(turn);
  if (text.includes('ASSA_METADATA: [FAILED:')) return true;
  if (text.includes('ASSA_METADATA: [SUCCESS:')) return false;

  if (turn.toolCalls) {
    return turn.toolCalls.some((tc) => {
      if (tc.status === 'error') return true;
      const res = JSON.stringify(tc.result || '');
      return res.includes('Exit Code: 1') || res.toLowerCase().includes('error:');
    });
  }
  return false;
}

function isToolSuccess(turn: TranscriptTurn): boolean {
  const text = extractAllText(turn);
  if (text.includes('ASSA_METADATA: [SUCCESS:')) return true;
  if (text.includes('ASSA_METADATA: [FAILED:')) return false;

  if (turn.toolCalls) {
    return turn.toolCalls.every((tc) => {
      if (tc.status === 'success') return true;
      const res = JSON.stringify(tc.result || '');
      return !res.includes('Exit Code: 1') && !res.toLowerCase().includes('error:');
    });
  }
  return false;
}

/**
 * Semantic Reflection Trigger (Hyper-Sensitive)
 * Detects implicit learning opportunities beyond simple keywords.
 */
const POTENTIAL_SIGNAL_HINTS = [
  'perfect', 'exactly', 'better', 'prefer', 'instead', 'wrong', 'correct',
  'should', 'must', 'always', 'never', 'refactor', 'standard',
  '很好', '不错', '不对', '建议', '喜欢', '习惯', '应该', '千万', '记得'
];

function detectReflectionOpportunity(transcript: TranscriptTurn[], currentPrompt: string): string {
  let reflexContext = '';

  const currentText = currentPrompt.toLowerCase();
  const hasHint = POTENTIAL_SIGNAL_HINTS.some((h) => currentText.includes(h));
  const isSubstantial = currentPrompt.length > 30; // Lowered threshold for sensitivity

  // 1. Interaction Reflection
  if (hasHint || isSubstantial) {
    reflexContext += '### ASSA REFLEX: SEMANTIC INTERACTION AUDIT ###\n' +
      'Recent user guidance contains potential architectural or stylistic preferences. ' +
      'You MUST analyze the semantic intent. Does this imply a recurring rule or a "Golden Standard"? ' +
      'Record any distilled wisdom into the L1 ledger immediately. ' +
      'Do not wait for praise; learn from the logic.\n\n';
  }

  // 2. Victory/Barrier detection (remains structural but with semantic prompt)
  const toolTurns = transcript.filter((t) => t.toolCalls && t.toolCalls.length > 0);
  if (toolTurns.length >= 2) {
    for (let i = 1; i < toolTurns.length; i++) {
      if (isToolFailure(toolTurns[i - 1]) && isToolSuccess(toolTurns[i])) {
        reflexContext += '### ASSA REFLEX: BREAKTHROUGH ANALYSIS ###\n' +
          'A tool just succeeded after a failure. This is a "Victory". ' +
          'Analyze the semantic difference between the failed attempt and the success. ' +
          'Formalize the technical adjustment into a reusable rule via `submit_memory_signal`.\n\n';
        break;
      }
    }

    for (let i = 2; i < toolTurns.length; i++) {
      if (isToolFailure(toolTurns[i - 2]) && isToolFailure(toolTurns[i - 1]) && isToolFailure(toolTurns[i])) {
        reflexContext += '### ASSA REFLEX: BARRIER IDENTIFICATION ###\n' +
          'Three consecutive tool failures detected. You are facing a significant technical barrier. ' +
          'Analyze the Root Cause (environmental, logical, or stylistic) and record it as a "Technical Barrier" to prevent future deadlocks.\n\n';
        break;
      }
    }
  }

  return reflexContext;
}

function cascadeRewound(ledger: SignalRecord[], transcript: TranscriptTurn[], sessionId: string): boolean {
  if (!sessionId) return false;

  let allTranscriptContent = '';
  transcript.forEach((turn) => {
    allTranscriptContent += (turn.id || '') + ' ';
    allTranscriptContent += extractAllText(turn) + ' ';
  });

  let changed = false;
  for (const entry of ledger) {
    if (entry.session_id === sessionId) {
      const isPresent = allTranscriptContent.includes(entry.message_id);

      if ((entry.status === 'PENDING' || entry.status === 'PROCESSED') && !isPresent) {
        entry.status = 'REWOUND';
        changed = true;
      } else if (entry.status === 'REWOUND' && isPresent) {
        entry.status = 'PENDING';
        changed = true;
      }
    }
  }
  return changed;
}

function safeReadFile(filepath: string): string {
  if (fs.existsSync(filepath)) return fs.readFileSync(filepath, 'utf8') + '\n';
  return '';
}

export async function main() {
  try {
    const inputData = fs.readFileSync(0, 'utf8');
    if (!inputData) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
      return;
    }

    const payload = JSON.parse(inputData);
    const agentName = payload.agentName || 'main';
    const sessionId = payload.sessionId || payload.session_id || 'unknown';
    const currentPrompt = payload.prompt || '';
    const overrides = payload.overrides || {};
    const extensionPath = payload.extensionPath || '';

    let transcript: TranscriptTurn[] = [];
    if (payload.transcript_path && fs.existsSync(payload.transcript_path)) {
      try {
        const fileContent = fs.readFileSync(payload.transcript_path, 'utf8');
        const history = JSON.parse(fileContent);
        transcript = history.messages || (Array.isArray(history) ? history : []);
      } catch (e) {}
    }

    // Bypass for evolution agents
    if (['distiller', 'syncer'].includes(agentName.toLowerCase()) || process.env.ASSA_EVOLVING) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
      return;
    }

    if (extensionPath) {
      ensureL3Setup(extensionPath);
    }
    ensureLocalSetup();

    const ledgerManager = new LedgerManager(process.cwd());
    ledgerManager.updateStatus((ledger) => {
      cascadeRewound(ledger, transcript, sessionId);
    });

    const health = checkSystemHealth(process.cwd(), overrides);
    const reflexContext = detectReflectionOpportunity(transcript, currentPrompt);
    const globalDir = path.join(os.homedir(), '.gemini', 'assa');

    let additionalContext = '';
    if (health.status !== 'healthy') {
      additionalContext += '### ASSA HEALTH WARNING ###\n' +
        '⚠️ Your self-evolution environment has issues:\n' +
        health.warnings.map((w) => `- ${w}`).join('\n') + '\n' +
        (health.fixSuggestion ? `💡 Suggestion: ${health.fixSuggestion}\n` : '') + '\n';
    }

    additionalContext += `### ASSA SESSION ID: ${sessionId} ###\n\n`;
    additionalContext += '### L2 PROJECT PATTERNS & DECISIONS ###\n';
    additionalContext += safeReadFile('.memory/patterns.md');
    additionalContext += safeReadFile('.memory/decisions.md');

    additionalContext += '\n### L3 GLOBAL WISDOM ###\n';
    additionalContext += safeReadFile(path.join(globalDir, 'SOUL.md'));
    additionalContext += safeReadFile(path.join(globalDir, 'USER_HANDBOOK.md'));
    additionalContext += safeReadFile(path.join(globalDir, 'LIBRARY', 'PROMOTED_PATTERNS.md'));

    // Domain-Aware Loading
    const libraryDir = path.join(globalDir, 'LIBRARY');
    const indexPath = path.join(libraryDir, 'index.json');
    if (fs.existsSync(indexPath)) {
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        const cwd = process.cwd().toLowerCase();
        if (index.mappings && Array.isArray(index.mappings)) {
          index.mappings.forEach((m: any) => {
            if (m.domains.some((d: string) => cwd.includes(d.toLowerCase()))) {
              additionalContext += safeReadFile(path.join(libraryDir, m.pattern));
            }
          });
        }
      } catch (e) {}
    }

    // L1 Pending Signals
    const pendingItems = ledgerManager.getPending();
    if (pendingItems.length >= 5) {
      additionalContext += `\n### L1 PENDING SIGNALS (${pendingItems.length} accumulated — DEEP DISTILLATION REQUIRED) ###\n`;
      additionalContext += `⚠️ ${pendingItems.length} signals accumulated. Invoke \`distiller\` as subagent.\n`;
      additionalContext += JSON.stringify(pendingItems, null, 2) + '\n';
    } else if (pendingItems.length > 0) {
      additionalContext += '\n### L1 PENDING SIGNALS (use distill_pending tool for quick processing) ###\n';
      additionalContext += JSON.stringify(pendingItems, null, 2) + '\n';
    }

    if (reflexContext) {
      additionalContext += `\n🚨 ASSA IMMEDIATE REFLEXES 🚨\n${reflexContext}\n`;
    }

    // Context Explosion Guard
    if (additionalContext.length > 20480) {
      additionalContext = `### ASSA SESSION ID: ${sessionId} ###\n\n` +
        `⚠️ CONTEXT SAFETY LIMIT EXCEEDED (${Math.round(additionalContext.length / 1024)} KB) ⚠️\n` +
        'Invoke `distiller` to distill signals.\n';
    }

    process.stdout.write(JSON.stringify({
      decision: 'allow',
      hookSpecificOutput: { additionalContext }
    }) + '\n');

  } catch (err) {
    process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}
