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
  const { tool_name, tool_input, tool_response, session_id } = input;
  const ledgerManager = new LedgerManager(process.cwd());

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
        'A git commit just occurred. 请根据 `git diff HEAD~1` 评估此提交的意义。如果包含架构变更、核心逻辑修改或新模式，请调用 `distiller`；如果是琐碎改动（如更新计划、文档或格式），请跳过深度提炼。\n\n';
    }

    // 2. Git Push Trigger
    if (cmd.includes('git push') && !isError) {
      additionalContext +=
        '\n### ASSA TRIGGER: GIT PUSH DETECTED ###\n' +
        'A git push just occurred. 你必须立即调用 `request_global_promotion` 工具（或分派 `syncer` 子代理）来评估 L2 模式库中的成熟条目并将其提升到 L3 全局库。\n\n';
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
      ledgerManager.addSignal({
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
    ledgerManager.addSignal({
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
  try {
    const inputData = fs.readFileSync(0, 'utf8');
    if (!inputData) return;

    const input: AfterToolInput = JSON.parse(inputData);

    // DIAGNOSTIC LOGGING
    const debugDir = path.join(process.cwd(), '.memory', 'debug');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    fs.writeFileSync(
      path.join(debugDir, `afterTool_${Date.now()}.json`),
      JSON.stringify({ input, cwd: process.cwd() }, null, 2),
    );

    const output = await afterToolHook(input);
    process.stdout.write(JSON.stringify(output) + '\n');
  } catch (err) {
    // Silent fail for hooks to not disrupt the main flow
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}
