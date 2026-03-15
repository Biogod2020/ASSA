const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const QUEUE_PATH = path.resolve(process.cwd(), '.memory/skill_queue.json');

function main() {
    if (!fs.existsSync(QUEUE_PATH)) {
        console.log('No skill queue found.');
        return;
    }

    const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
    const staged = queue.filter(item => item.status === 'STAGED');

    if (staged.length === 0) {
        console.log('No staged skills to deploy.');
        return;
    }

    staged.forEach(skill => {
        console.log(`Deploying skill: ${skill.id}...`);
        const skillPath = path.resolve(process.cwd(), skill.skill_path);
        
        const result = spawnSync('gemini', ['skills', 'install', skillPath, '--scope', 'user', '--consent'], {
            encoding: 'utf8',
            stdio: 'inherit'
        });

        if (result.status === 0) {
            console.log(`\n✅ Skill ${skill.id} installed successfully!`);
            console.log(`\n👉 NEXT STEP: You MUST manually run '/skills reload' in your Gemini CLI session to enable the new capability.`);
            skill.status = 'DEPLOYED';
            skill.deployed_at = new Date().toISOString();
        } else {
            console.log(`\n❌ Failed to install skill ${skill.id}.`);
        }
    });

    fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2), 'utf8');
}

main();
