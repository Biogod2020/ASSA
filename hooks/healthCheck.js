const fs = require('fs');
const path = require('path');
const os = require('os');

function checkSystemHealth(workspaceRoot = process.cwd(), overrides = {}) {
    const health = {
        status: 'healthy',
        enableAgents: false,
        memoryDirExists: false,
        globalDirExists: false,
        ledgerIntegrity: 'ok',
        warnings: []
    };

    // 1. Check settings.json
    const settingsPath = overrides.settingsPath || path.join(os.homedir(), '.gemini/settings.json');
    if (fs.existsSync(settingsPath)) {
        try {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            
            // Check Agents
            health.enableAgents = settings.experimental?.enableAgents === true;
            if (!health.enableAgents) {
                health.status = 'warning';
                health.warnings.push('Subagents are disabled (experimental.enableAgents: false in settings.json). ASSA Distillation will not work.');
                health.fixSuggestion = 'To fix, run: gemini /settings -> Experimental -> Enable Agents -> Enabled (or edit ~/.gemini/settings.json manually).';
            }

            // Check Workspace Context (includeDirectories)
            const libraryPath = path.join(os.homedir(), '.gemini', 'assa', 'LIBRARY', '/');
            const includedDirs = settings.context?.includeDirectories || [];
            health.libraryIncluded = includedDirs.includes(libraryPath);
            
            if (!health.libraryIncluded) {
                health.status = 'warning';
                health.warnings.push(`Global Library path is NOT in includeDirectories. Subagents cannot write to the global library.`);
                health.fixSuggestion = `Run the following command to fix: node -e "const fs=require('fs'),path=require('path'),os=require('os');const p=path.join(os.homedir(),'.gemini','settings.json');const s=JSON.parse(fs.readFileSync(p,'utf8'));if(!s.context)s.context={};if(!s.context.includeDirectories)s.context.includeDirectories=[];const lp=path.join(os.homedir(),'.gemini','assa','LIBRARY','/');if(!s.context.includeDirectories.includes(lp)){s.context.includeDirectories.push(lp);fs.writeFileSync(p,JSON.stringify(s,null,2));console.log('Fixed includeDirectories.');}"`;
            }
        } catch (e) {
            health.warnings.push(`Error parsing settings.json: ${e.message}`);
        }
    } else {
        health.warnings.push('Gemini CLI settings.json not found.');
    }

    // 2. Check local directories
    const memoryDir = overrides.memoryDir || path.join(workspaceRoot, '.memory');
    health.memoryDirExists = fs.existsSync(memoryDir);
    if (!health.memoryDirExists) {
        health.status = 'warning';
        health.warnings.push('Local .memory directory is missing.');
    }

    // 3. Check global directories
    const globalDir = overrides.globalDir || path.join(os.homedir(), '.gemini/assa');
    health.globalDirExists = fs.existsSync(globalDir);
    if (!health.globalDirExists) {
        health.status = 'warning';
        health.warnings.push('Global ASSA directory (~/.gemini/assa) is missing.');
    }

    // 4. Check Ledger Integrity
    const ledgerPath = path.join(memoryDir, 'evolution_ledger.json');
    if (fs.existsSync(ledgerPath)) {
        try {
            const content = fs.readFileSync(ledgerPath, 'utf8');
            if (content.trim()) {
                JSON.parse(content);
            }
        } catch (e) {
            health.status = 'error';
            health.ledgerIntegrity = 'corrupted';
            health.warnings.push(`Ledger file is corrupted: ${e.message}`);
        }
    }

    // 5. Check Extension Manifest & MCP Server Config
    const manifestPath = path.join(workspaceRoot, 'gemini-extension.json');
    if (fs.existsSync(manifestPath)) {
        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            const mcpServers = manifest.mcpServers || {};
            if (!mcpServers['assa-mcp']) {
                health.status = 'warning';
                health.warnings.push('assa-mcp server is not defined in gemini-extension.json.');
            } else {
                const serverCmd = mcpServers['assa-mcp'].command;
                if (serverCmd.includes('node')) {
                    // Extract path if possible or just assume it's there for now
                }
            }
        } catch (e) {
            health.warnings.push(`Error parsing gemini-extension.json: ${e.message}`);
        }
    }

    return health;
}

module.exports = { checkSystemHealth };
