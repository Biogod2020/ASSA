"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.afterToolHook = void 0;
const ledger_1 = require("./ledger");
/**
 * Smart Reflex: After Tool Hook
 * Automatically detects successes/failures and logs signals.
 */
const afterToolHook = async (context) => {
    const { toolName, result } = context;
    const ledgerManager = new ledger_1.LedgerManager(process.cwd());
    // Victory Detection: Successful breakthrough or significant completion
    if (!result.isError) {
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
        const resultContent = result.content
            .map((c) => c.text || '')
            .join(' ')
            .toLowerCase();
        const hasMarker = successMarkers.some((k) => resultContent.includes(k));
        const isSignificant = resultContent.length > 200; // Large outputs often contain patterns
        if (hasMarker || isSignificant) {
            ledgerManager.addSignal({
                session_id: 'auto-detect',
                message_id: `auto-${Date.now()}`,
                type: 'breakthrough',
                payload: {
                    rule: `Potential Breakthrough in tool: ${toolName}`,
                    context: `Result content: ${resultContent.slice(0, 150)}...`,
                    tags: ['auto-reflex', 'sensitivity-high'],
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
exports.afterToolHook = afterToolHook;
