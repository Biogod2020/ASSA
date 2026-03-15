const { spawn } = require('child_process');

function main() {
    let inputData = '';
    process.stdin.on('data', chunk => {
        inputData += chunk;
    });

    process.stdin.on('end', () => {
        try {
            const input = JSON.parse(inputData || '{}');
            const toolInput = input.tool_input || {};
            const topic = toolInput.topic || 'all';

            // Trigger syncer sub-agent
            const child = spawn('gemini', ['--agent', 'syncer', '--prompt', `Promote patterns related to: ${topic}`], {
                detached: true,
                stdio: 'ignore'
            });
            child.unref();

            console.log(JSON.stringify({ status: 'success', message: `Promotion requested for topic: ${topic}` }));
        } catch (err) {
            console.log(JSON.stringify({ status: 'error', message: err.message }));
        }
    });
}

if (require.main === module) {
    main();
}
