import fs from 'fs';
import path from 'path';
import os from 'os';
import { checkSystemHealth } from '../healthCheck';

describe('healthCheck', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'health-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('should return warning when .memory dir is missing', () => {
    const health = checkSystemHealth(tempDir, {
      settingsPath: path.join(tempDir, 'non_existent_settings.json'),
    });

    expect(health.status).toBe('warning');
    expect(health.memoryDirExists).toBe(false);
    expect(health.warnings).toContain('Local .memory directory is missing.');
  });

  test('should detect disabled agents in settings.json', () => {
    const settingsPath = path.join(tempDir, 'settings.json');
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({ experimental: { enableAgents: false } }),
    );

    const health = checkSystemHealth(tempDir, { settingsPath });

    expect(health.enableAgents).toBe(false);
    expect(health.status).toBe('warning');
    expect(
      health.warnings.some((w) => w.includes('Subagents are disabled')),
    ).toBe(true);
  });

  test('should detect corrupted ledger', () => {
    const memoryDir = path.join(tempDir, '.memory');
    fs.mkdirSync(memoryDir);
    const ledgerPath = path.join(memoryDir, 'evolution_ledger.json');
    fs.writeFileSync(ledgerPath, 'invalid json {');

    const health = checkSystemHealth(tempDir, {
      settingsPath: path.join(tempDir, 'no_settings.json'),
    });

    expect(health.ledgerIntegrity).toBe('corrupted');
    expect(health.status).toBe('error');
  });

  test('should be healthy when all requirements are met', () => {
    const memoryDir = path.join(tempDir, '.memory');
    fs.mkdirSync(memoryDir);

    const globalDir = path.join(tempDir, 'global_assa');
    fs.mkdirSync(globalDir, { recursive: true });

    const settingsPath = path.join(tempDir, 'settings.json');
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({ experimental: { enableAgents: true } }),
    );

    const manifestPath = path.join(tempDir, 'gemini-extension.json');
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ mcpServers: { 'assa-mcp': {} } }),
    );

    const health = checkSystemHealth(tempDir, {
      settingsPath,
      globalDir,
      memoryDir,
    });

    expect(health.status).toBe('healthy');
    expect(health.warnings.length).toBe(0);
  });
});
