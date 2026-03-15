const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ledgerUtils = require('./ledgerUtils');

function main() {
    let inputData = '';
    process.stdin.on('data', chunk => {
        inputData += chunk;
    });

    process.stdin.on('end', () => {
        try {
            const input = JSON.parse(inputData || '{}');
            const toolInput = input.tool_input || {};
            const messageId = input.message_id;

            if (!messageId) {
                console.log(JSON.stringify({ status: 'error', message: 'message_id is required from the framework payload' }));
                return;
            }

            ledgerUtils.updateLedger((ledger) => {
                const record = {
                    session_id: input.session_id || 'unknown',
                    message_id: messageId,
                    timestamp: new Date().toISOString(),
                    status: 'PENDING',
                    type: toolInput.type || 'unknown',
                    payload: {
                        rule: toolInput.rule || '',
                        context: toolInput.context || '',
                        tags: toolInput.tags || []
                    },
                    git_anchor: ''
                };
                ledger.push(record);
                return ledger;
            });

            console.log(JSON.stringify({ status: 'success', message: 'Signal appended to ledger as PENDING' }));
        } catch (err) {
            console.log(JSON.stringify({ status: 'error', message: err.message }));
        }
    });
}

if (require.main === module) {
    main();
}
