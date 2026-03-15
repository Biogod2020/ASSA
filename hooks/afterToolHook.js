const fs = require('fs');
const path = require('path');

const EXTENSION_ROOT = path.dirname(__dirname);
const LOG_PATH = path.join(EXTENSION_ROOT, 'hook_debug.log');

function log(msg) {
    fs.appendFileSync(LOG_PATH, msg + '\n');
}

function main() {
    log(`AfterTool Hook fired at ${new Date().toISOString()}`);
    
    let inputData = '';
    try {
        inputData = fs.readFileSync(0, 'utf8');
    } catch (err) {
        log(`Error reading stdin: ${err.message}`);
    }

    const payload = JSON.parse(inputData || '{}');
    const toolName = payload.tool_name;
    const toolInput = payload.tool_input || {};
    const toolResponse = payload.tool_response || {};
    const llmContent = toolResponse.llmContent || '';

    log(`Tool Executed: ${toolName}`);
    // log(`Tool Response: ${JSON.stringify(toolResponse)}`);

    let additionalContext = '';

    // Standard reflex metadata: status and attempt tracking
    // Parse llmContent for Exit Code (Rule P-0022 workaround)
    // The pattern is usually 'Exit Code: 1' or 'exit code: 1' at the end of a line
    const exitCodeMatch = llmContent.match(/Exit [Cc]ode: (\d+)/);
    const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1]) : undefined;
    
    const isError = (exitCode !== undefined && exitCode !== 0) || 
                    toolResponse.status === 'error' || 
                    llmContent.toLowerCase().includes('error:');
                    
    const summary = isError ? `[FAILED: ${toolName}]` : `[SUCCESS: ${toolName}]`;
    log(`Result Determination: ${summary} (exitCode: ${exitCode})`);
    
    // Inject subtle status markers for pattern matching in the next turn
    additionalContext += `<!-- ASSA_METADATA: ${summary} -->\n`;

    // Detect git operations and inject hints for the main agent
    if (toolName === 'run_shell_command' || toolName === 'shell') {
        const cmd = toolInput.command || '';
        if (cmd.includes('git commit')) {
            log('Detected git commit → instructing main agent to dispatch Distiller subagent');
            additionalContext = '### ASSA TRIGGER: GIT COMMIT DETECTED ###\n' +
                'A git commit just occurred. 你必须立即调用 `distiller` 工具作为子代理（Subagent），' +
                '派发以下任务给它：\"读取最新的 .memory/evolution_ledger.json 和最近的 git diff，执行深度根因分析，并将结构化的 YAML 规则块写入 .memory/patterns.md。\" ' +
                '在派发完成后，请直接告诉我任务已派发，不要亲自执行该分析。这是为了保持主对话上下文的清洁。\n';
        } else if (cmd.includes('git push')) {
            log('Detected git push → instructing main agent to dispatch Syncer subagent');
            additionalContext = '### ASSA TRIGGER: GIT PUSH DETECTED ###\n' +
                'A git push just occurred. 你必须立即调用 `syncer` 工具作为子代理（Subagent），' +
                '派发以下任务给它：\"审计本地 .memory/patterns.md 中成熟度高的模式，剥离项目特定标识后，推广同步到全局库 ~/.gemini/assa/LIBRARY/ 下的相应文件中。\" ' +
                '在派发完成后，请直接告诉我任务已派发，不要亲自执行该同步。这是为了保持主对话上下文的清洁。\n';
        }
    }

    if (additionalContext) {
        console.log(JSON.stringify({
            decision: 'allow',
            hookSpecificOutput: { additionalContext }
        }));
    } else {
        console.log(JSON.stringify({ decision: 'allow' }));
    }
}

if (require.main === module) main();
