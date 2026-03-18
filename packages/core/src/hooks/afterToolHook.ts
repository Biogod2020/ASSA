import fs from 'fs';
import path from 'path';
import { AfterToolInput, AfterToolOutput } from './hookTypes';
import { LedgerManager } from './ledger';

/**
 * Smart Reflex: After Tool Hook
 * Automatically detects successes/failures and logs signals.
 * Aligned with official Gemini CLI Hook definitions.
 */
export const afterToolHook = async (
  input: AfterToolInput,
): Promise<AfterToolOutput> => {
  const { tool_name, tool_input, tool_response, session_id, cwd, agent_name } =
    input;

  // Bypass for evolution subagents (distiller, syncer, etc.) or explicit evolution flag
  const isEvolutionSubagent =
    agent_name &&
    ['distiller', 'syncer', 'skill_generator'].includes(
      agent_name.toLowerCase(),
    );

  if (process.env.ASSA_EVOLVING || isEvolutionSubagent) {
    return { decision: 'allow' };
  }

  const ledgerManager = new LedgerManager(cwd);

  let additionalContext = '';

  const responseContent = JSON.stringify(tool_response).toLowerCase();
  const isError =
    responseContent.includes('exit code: 1') ||
    responseContent.includes('error:') ||
    responseContent.includes('failed');

  // 1. Git Commit Trigger
  if (tool_name === 'run_shell_command' && tool_input.command) {
    const cmd = String(tool_input.command).toLowerCase();
    if (cmd.includes('git commit') && !isError) {
      additionalContext +=
        '\n### ASSA TRIGGER: GIT COMMIT DETECTED ###\n' +
        'A git commit just occurred. Please evaluate the significance of this commit based on `git diff HEAD~1`. If it contains architectural changes, core logic modifications, or new patterns, invoke `distiller`. If it contains trivial changes (e.g., updates to plans, docs, or formatting), skip deep distillation.\n\n';
    }

    // 2. Git Push Trigger
    if (cmd.includes('git push') && !isError) {
      additionalContext +=
        '\n### ASSA TRIGGER: GIT PUSH DETECTED ###\n' +
        'A git push just occurred. You MUST immediately invoke the `request_global_promotion` tool (or dispatch the `syncer` subagent) to audit mature entries in the L2 pattern library and promote them to the L3 Global Library.\n\n';
    }
  }

  // 3. Victory Detection: Successful breakthrough
  if (!isError) {
    const successMarkers = [
      'success',
      'breakthrough',
      'victory',
      'done',
      'fixed',
      'resolved',
      'improved',
      'perfect',
      'correct',
      '完成',
      '修复',
      '解决',
    ];

    const hasMarker = successMarkers.some((k) => responseContent.includes(k));
    const isSignificant = responseContent.length > 500;

    if (hasMarker || isSignificant) {
      await ledgerManager.addSignal({
        session_id: session_id || 'auto-detect',
        message_id: `auto-${Date.now()}`,
        type: 'breakthrough',
        payload: {
          rule: `Potential Breakthrough in tool: ${tool_name}`,
          context: `Result snippet: ${responseContent.slice(0, 200)}...`,
          tags: ['auto-reflex', 'victory'],
        },
      });
    }
  }

  // 4. Barrier Detection
  if (isError) {
    await ledgerManager.addSignal({
      session_id: session_id || 'auto-detect',
      message_id: `auto-${Date.now()}`,
      type: 'barrier',
      payload: {
        rule: `Barrier encountered in tool: ${tool_name}`,
        context: `Error snippet: ${responseContent.slice(0, 300)}`,
        tags: ['auto-reflex', 'barrier'],
      },
    });
  }

  const output: AfterToolOutput = {
    decision: 'allow',
  };

  if (additionalContext) {
    output.hookSpecificOutput = {
      hookEventName: 'AfterTool',
      additionalContext: additionalContext.trim(),
    };
  }

  return output;
};

/**
 * Entry point for AfterTool command-type hook
 */
async function main() {
  // Redirect logs to stderr to keep stdout pure for CLI JSON communication
  console.log = console.error;
  console.warn = console.error;

  try {
    const inputData = fs.readFileSync(0, 'utf8');
    if (!inputData) {
      return;
    }

    const input: AfterToolInput = JSON.parse(inputData);
    const { cwd } = input;
    const session_id = input.session_id || input.sessionId || 'unknown';
    const agent_name = input.agent_name || input.agentName || 'main';

    // Normalize input for the hook function
    const normalizedInput = { ...input, session_id, agent_name };

    // DIAGNOSTIC LOGGING
    const debugDir = path.join(cwd, '.memory', 'debug');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    fs.writeFileSync(
      path.join(debugDir, `afterTool_${Date.now()}.json`),
      JSON.stringify({ input: normalizedInput }, null, 2),
    );

    const output = await afterToolHook(normalizedInput);
    process.stdout.write(JSON.stringify(output) + '\n');
  } catch (err: any) {
    console.error('[ASSA Debug] AfterTool Hook: FATAL ERROR:', err.stack || err.message);
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}
