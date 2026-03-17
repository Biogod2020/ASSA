"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSystemHealth = checkSystemHealth;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
function checkSystemHealth(workspaceRoot = process.cwd(), overrides = {}) {
    const health = {
        status: 'healthy',
        enableAgents: false,
        memoryDirExists: false,
        globalDirExists: false,
        ledgerIntegrity: 'ok',
        warnings: [],
    };
    // 1. Check experimental.enableAgents in settings.json
    const settingsPath = overrides.settingsPath ||
        path_1.default.join(os_1.default.homedir(), '.gemini/settings.json');
    if (fs_1.default.existsSync(settingsPath)) {
        try {
            const settings = JSON.parse(fs_1.default.readFileSync(settingsPath, 'utf8'));
            health.enableAgents = settings.experimental?.enableAgents === true;
            if (!health.enableAgents) {
                health.status = 'warning';
                health.warnings.push('Subagents are disabled (experimental.enableAgents: false in settings.json). ASSA Distillation will not work.');
                health.fixSuggestion =
                    'To fix, run: gemini /settings -> Experimental -> Enable Agents -> Enabled (or edit ~/.gemini/settings.json manually).';
            }
        }
        catch (e) {
            health.warnings.push(`Error parsing settings.json: ${e.message}`);
        }
    }
    else {
        health.warnings.push('Gemini CLI settings.json not found.');
    }
    // 2. Check local directories
    const memoryDir = overrides.memoryDir || path_1.default.join(workspaceRoot, '.memory');
    health.memoryDirExists = fs_1.default.existsSync(memoryDir);
    if (!health.memoryDirExists) {
        health.status = 'warning';
        health.warnings.push('Local .memory directory is missing.');
    }
    // 3. Check global directories
    const globalDir = overrides.globalDir || path_1.default.join(os_1.default.homedir(), '.gemini/assa');
    health.globalDirExists = fs_1.default.existsSync(globalDir);
    if (!health.globalDirExists) {
        health.status = 'warning';
        health.warnings.push('Global ASSA directory (~/.gemini/assa) is missing.');
    }
    // 4. Check Ledger Integrity
    const ledgerPath = path_1.default.join(memoryDir, 'evolution_ledger.json');
    if (fs_1.default.existsSync(ledgerPath)) {
        try {
            const content = fs_1.default.readFileSync(ledgerPath, 'utf8');
            if (content.trim()) {
                JSON.parse(content);
            }
        }
        catch (e) {
            health.status = 'error';
            health.ledgerIntegrity = 'corrupted';
            health.warnings.push(`Ledger file is corrupted: ${e.message}`);
        }
    }
    // 5. Check Extension Manifest & MCP Server Config
    const manifestPath = path_1.default.join(workspaceRoot, 'gemini-extension.json');
    if (fs_1.default.existsSync(manifestPath)) {
        try {
            const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf8'));
            const mcpServers = manifest.mcpServers || {};
            if (!mcpServers['assa-mcp']) {
                health.status = 'warning';
                health.warnings.push('assa-mcp server is not defined in gemini-extension.json.');
            }
        }
        catch (e) {
            health.warnings.push(`Error parsing gemini-extension.json: ${e.message}`);
        }
    }
    return health;
}
