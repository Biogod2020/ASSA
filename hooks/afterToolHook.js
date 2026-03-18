const fs = require('fs');
const path = require('path');

const EXTENSION_ROOT = path.dirname(__dirname);
const LOG_PATH = path.join(EXTENSION_ROOT, 'hook_debug.log');

function log(msg) {
    fs.appendFileSync(LOG_PATH, msg + '\n');
}

// Redirect all unexpected logs to stderr to keep stdout pure for JSON
console.log = console.error;
console.warn = console.error;

process.on('uncaughtException', (err) => {
    log(`UNCAUGHT EXCEPTION: ${err.stack}`);
    process.exit(0);
});

function main() {
    try {
        log(`AfterTool Hook fired at ${new Date().toISOString()}`);
        
        let inputData = '';
        try {
            inputData = fs.readFileSync(0, 'utf8');
        } catch (err) {
            log(`Error reading stdin: ${err.message}`);
        }

        if (!inputData || !inputData.trim()) {
            process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
            return;
        }

        let payload;
        try {
            payload = JSON.parse(inputData);
        } catch (e) {
            log(`JSON parse error: ${e.message}`);
            process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
            return;
        }

        const toolName = payload.tool_name || 'unknown';
        const toolInput = payload.tool_input || {};
        const toolResponse = payload.tool_response || {};
        
        // Extract plain text from llmContent (could be string, Part, or Part[])
        let llmText = '';
        if (typeof toolResponse.llmContent === 'string') {
            llmText = toolResponse.llmContent;
        } else if (Array.isArray(toolResponse.llmContent)) {
            llmText = toolResponse.llmContent.map(p => p.text || '').join('\n');
        } else if (toolResponse.llmContent && typeof toolResponse.llmContent === 'object') {
            llmText = toolResponse.llmContent.text || JSON.stringify(toolResponse.llmContent);
        }

        const exitCodeMatch = llmText.match(/Exit [Cc]ode: (\d+)/i);
        const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1]) : undefined;
        
        // A tool truly failed if:
        // 1. Explicit error object is present
        // 2. Exit code is defined and non-zero
        // 3. Status is explicitly 'error' (if provided)
        const isError = !!toolResponse.error || (exitCode !== undefined && exitCode !== 0) || toolResponse.status === 'error';
                        
        const summary = isError ? `[FAILED: ${toolName}]` : `[SUCCESS: ${toolName}]`;
        log(`Tool: ${toolName}, Status: ${toolResponse.status}, ExitCode: ${exitCode}, HasError: ${!!toolResponse.error} -> ${summary}`);
        
        let additionalContext = `<!-- ASSA_METADATA: ${summary} -->\n`;

        // Detect git operations and inject hints
        if (toolName === 'run_shell_command' || toolName === 'shell') {
            const cmd = toolInput.command || '';
            if (cmd.includes('git commit')) {
                additionalContext += '### ASSA TRIGGER: GIT COMMIT DETECTED ###\n' +
                    'A git commit just occurred. 请根据 `git diff HEAD~1` 评估此提交的意义。如果包含架构变更、核心逻辑修改或新模式，请调用 `distiller`；如果是琐碎改动（如更新计划、文档或格式），请跳过深度提炼。\n';
            } else if (cmd.includes('git push')) {
                additionalContext += '### ASSA TRIGGER: GIT PUSH DETECTED ###\n' +
                    'A git push just occurred. 你必须立即调用 `syncer` 工具作为子代理（Subagent）执行同步任务。\n';
            }
        }

        process.stdout.write(JSON.stringify({
            decision: 'allow',
            hookSpecificOutput: { additionalContext }
        }) + '\n');
    } catch (globalErr) {
        log(`GLOBAL CRASH in AfterTool: ${globalErr.stack}`);
        process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
    }
}

main();
