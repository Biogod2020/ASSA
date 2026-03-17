import { AfterToolHookContext } from './hookTypes';
import { LedgerManager } from './ledger';

/**
 * Smart Reflex: After Tool Hook
 * Automatically detects successes/failures and logs signals.
 */
export const afterToolHook = async (context: AfterToolHookContext): Promise<void> => {
  const { toolName, result } = context;
  const ledgerManager = new LedgerManager(process.cwd());

  // Victory Detection: Successful breakthrough after errors
  if (!result.isError) {
    const successKeywords = ['Success', 'Breakthrough', 'Victory', 'Done'];
    const resultContent = result.content.map((c) => c.text || '').join(' ');
    
    if (successKeywords.some((k) => resultContent.includes(k))) {
      ledgerManager.addSignal({
        session_id: 'auto-detect',
        message_id: `auto-${Date.now()}`,
        type: 'breakthrough',
        payload: {
          rule: `Breakthrough detected in tool: ${toolName}`,
          context: `Result content: ${resultContent.slice(0, 100)}...`,
          tags: ['auto-reflex', 'victory'],
        },
      });
    }
  }

  // Barrier Detection: Persistent failures (logged for RCA)
  if (result.isError) {
    ledgerManager.addSignal({
      session_id: 'auto-detect',
      message_id: `auto-${Date.now()}`,
      type: 'barrier',
      payload: {
        rule: `Barrier encountered in tool: ${toolName}`,
        context: `Error message: ${result.content.map((c) => c.text || '').join(' ')}`,
        tags: ['auto-reflex', 'barrier'],
      },
    });
  }
};
