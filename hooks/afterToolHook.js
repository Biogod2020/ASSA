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
        const cwd = payload.cwd || process.cwd();
        
        // Reliability Hardening: Use explicit error property and exitCode
        const llmContent = typeof toolResponse.llmContent === 'string' 
            ? toolResponse.llmContent 
            : JSON.stringify(toolResponse.llmContent || '');
        const exitCodeMatch = llmContent.match(/Exit [Cc]ode: (\d+)/i);
        const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1]) : undefined;
        
        // A tool truly failed if:
        // 1. toolResponse.error exists (official way)
        // 2. Exit code is defined and non-zero (shell specific)
        const isError = !!toolResponse.error || (exitCode !== undefined && exitCode !== 0);
                        
        const summary = isError ? `[FAILED: ${toolName}]` : `[SUCCESS: ${toolName}]`;
        log(`Tool: ${toolName}, Error: ${!!toolResponse.error}, ExitCode: ${exitCode} -> ${summary}`);
        
        let additionalContext = `<!-- ASSA_METADATA: ${summary} -->\n`;

        // Detect git operations and inject hints
        if (toolName === 'run_shell_command' || toolName === 'shell') {
            const cmd = toolInput.command || '';
            if (cmd.includes('git commit')) {
                additionalContext += '### ASSA TRIGGER: GIT COMMIT DETECTED ###\n' +
                    'A git commit just occurred. Evaluate the significance of this commit based on `git diff HEAD~1`. If it contains architectural changes, core logic modifications, or new patterns, you MUST dispatch the `distiller` sub-agent. Skip deep distillation for trivial changes (e.g., plan updates, documentation, or formatting).\n';
            } else if (cmd.includes('git push')) {
                additionalContext += '### ASSA TRIGGER: GIT PUSH DETECTED ###\n' +
                    'A git push just occurred. You MUST IMMEDIATELY dispatch the `syncer` sub-agent (via the `generalist` tool) to perform global synchronization tasks.\n';
            }
        }

        process.stdout.write(JSON.stringify({
            decision: 'allow',
            hookSpecificOutput: { 
                hookEventName: 'AfterTool',
                additionalContext 
            }
        }) + '\n');
    } catch (globalErr) {
        log(`GLOBAL CRASH in AfterTool: ${globalErr.stack}`);
        process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
    }
}

main();
