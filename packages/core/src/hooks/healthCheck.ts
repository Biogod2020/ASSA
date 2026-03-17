import fs from 'fs';
import path from 'path';
import os from 'os';

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  enableAgents: boolean;
  memoryDirExists: boolean;
  globalDirExists: boolean;
  ledgerIntegrity: 'ok' | 'corrupted';
  warnings: string[];
  fixSuggestion?: string;
}

export function checkSystemHealth(
  workspaceRoot: string = process.cwd(),
  overrides: Record<string, any> = {}
): SystemHealth {
  const health: SystemHealth = {
    status: 'healthy',
    enableAgents: false,
    memoryDirExists: false,
    globalDirExists: false,
    ledgerIntegrity: 'ok',
    warnings: [],
  };

  // 1. Check experimental.enableAgents in settings.json
  const settingsPath =
    overrides.settingsPath ||
    path.join(os.homedir(), '.gemini/settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      health.enableAgents = settings.experimental?.enableAgents === true;
      if (!health.enableAgents) {
        health.status = 'warning';
        health.warnings.push(
          'Subagents are disabled (experimental.enableAgents: false in settings.json). ASSA Distillation will not work.'
        );
        health.fixSuggestion =
          'To fix, run: gemini /settings -> Experimental -> Enable Agents -> Enabled (or edit ~/.gemini/settings.json manually).';
      }
    } catch (e: any) {
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
  const globalDir =
    overrides.globalDir || path.join(os.homedir(), '.gemini/assa');
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
    } catch (e: any) {
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
        health.warnings.push(
          'assa-mcp server is not defined in gemini-extension.json.'
        );
      }
    } catch (e: any) {
      health.warnings.push(`Error parsing gemini-extension.json: ${e.message}`);
    }
  }

  return health;
}
