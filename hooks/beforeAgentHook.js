const fs = require('fs');
const path = require('path');
const os = require('os');

const EXTENSION_ROOT = path.dirname(__dirname);
const LOG_PATH = path.join(EXTENSION_ROOT, 'hook_debug.log');
const ledgerUtils = require(path.join(EXTENSION_ROOT, 'skills', 'assa-core', 'scripts', 'ledgerUtils'));

function log(msg) {
    fs.appendFileSync(LOG_PATH, msg + '\n');
}

function ensureL3Setup() {
    const globalDir = path.join(os.homedir(), '.gemini', 'assa');
    const libraryDir = path.join(globalDir, 'LIBRARY');
    const templatesDir = path.join(EXTENSION_ROOT, 'templates');
    
    if (!fs.existsSync(globalDir)) {
        fs.mkdirSync(libraryDir, { recursive: true });
        ['SOUL.md', 'USER_HANDBOOK.md', 'index.json'].forEach(filename => {
            const src = path.join(templatesDir, filename);
            const dst = path.join(globalDir, filename);
            if (fs.existsSync(src) && !fs.existsSync(dst)) fs.copyFileSync(src, dst);
        });
    }
}

function ensureLocalSetup() {
    const memoryDir = path.resolve(process.cwd(), '.memory');
    if (!fs.existsSync(memoryDir)) {
        fs.mkdirSync(memoryDir, { recursive: true });
    }
    ['patterns.md', 'decisions.md', 'local_habits.md', 'LESSONS_LEARNED.md'].forEach(file => {
        const filePath = path.join(memoryDir, file);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, `# ${file.split('.')[0].replace(/_/g, ' ').toUpperCase()}\n`, 'utf8');
        }
    });
}

function safeReadFile(filepath) {
    const absolutePath = path.resolve(process.cwd(), filepath);
    if (fs.existsSync(absolutePath)) return fs.readFileSync(absolutePath, 'utf8') + '\n';
    return '';
}

function main() {
    log(`BeforeAgent Hook Fired at ${new Date().toISOString()}`);
    
    let inputData = '';
    try {
        inputData = fs.readFileSync(0, 'utf8');
        log(`Read ${inputData.length} bytes from stdin`);
    } catch (err) {
        log(`Error reading stdin: ${err.message}`);
    }

    if (!inputData) {
        console.log(JSON.stringify({ decision: 'allow' }));
        return;
    }

    let payload;
    try {
        payload = JSON.parse(inputData);
    } catch (e) {
        log(`JSON parse error: ${e.message}`);
        console.log(JSON.stringify({ decision: 'allow' }));
        return;
    }

    const agentName = payload.agentName || 'main';
    log(`Agent: ${agentName}`);

    // Bypass for internal evolution agents
    if (['distiller', 'syncer'].includes(agentName.toLowerCase()) || process.env.ASSA_EVOLVING) {
        log(`Bypassing hook (ASSA_EVOLVING=${process.env.ASSA_EVOLVING}, Agent=${agentName})`);
        console.log(JSON.stringify({ decision: 'allow' }));
        return;
    }

    ensureL3Setup();
    ensureLocalSetup();

    // Assemble context — NO sub-agent spawning, just fast context injection
    const globalDir = path.join(os.homedir(), '.gemini', 'assa');
    let additionalContext = '### L3 GLOBAL WISDOM ###\n';
    additionalContext += safeReadFile(path.join(globalDir, 'SOUL.md'));
    additionalContext += safeReadFile(path.join(globalDir, 'USER_HANDBOOK.md'));
    additionalContext += safeReadFile(path.join(globalDir, 'index.json'));
    
    const ledger = ledgerUtils.loadLedger();
    const pendingItems = ledger.filter(e => e.status === 'PENDING');
    const DEEP_DISTILL_THRESHOLD = 5;
    if (pendingItems.length >= DEEP_DISTILL_THRESHOLD) {
        additionalContext += `### L1 PENDING SIGNALS (${pendingItems.length} accumulated — DEEP DISTILLATION REQUIRED) ###\n`;
        additionalContext += `⚠️ ${pendingItems.length} signals have accumulated. 你必须立即调用 \`generalist\` 工具作为子代理（Subagent），`;
        additionalContext += '派发以下任务给它："作为 ASSA Distiller，读取最新的这些信号及其相关的 git diff，执行深度根因分析，并生成结构化的 patterns.md 规则块（带 YAML 和 Rationale）。" ';
        additionalContext += '在派发完成后，请直接告诉我任务已派发，不要亲自执行该分析。\n';
        additionalContext += JSON.stringify(pendingItems, null, 2) + '\n\n';
    } else if (pendingItems.length > 0) {
        additionalContext += '### L1 PENDING SIGNALS (use distill_pending tool for quick processing) ###\n';
        additionalContext += JSON.stringify(pendingItems, null, 2) + '\n\n';
    }
        
    additionalContext += '### L2 PROJECT PATTERNS & DECISIONS ###\n';
    additionalContext += safeReadFile('.memory/patterns.md');
    additionalContext += safeReadFile('.memory/decisions.md');
    additionalContext += safeReadFile('.memory/local_habits.md');
    additionalContext += safeReadFile('.memory/LESSONS_LEARNED.md');

    log(`Context assembled: ${additionalContext.length} chars, ${pendingItems.length} pending signals`);

    console.log(JSON.stringify({
        decision: 'allow',
        hookSpecificOutput: { additionalContext }
    }));
}

main();
