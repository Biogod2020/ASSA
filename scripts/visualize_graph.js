const fs = require('fs');
const path = require('path');
const os = require('os');

const GLOBAL_DIR = path.join(os.homedir(), '.gemini', 'assa');
const GRAPH_PATH = path.join(GLOBAL_DIR, 'graph.json');

function generateMermaid() {
    if (!fs.existsSync(GRAPH_PATH)) {
        console.error("Graph file not found.");
        return;
    }

    const data = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
    const rules = Object.values(data.rules);

    let mermaid = 'graph TD\n';
    
    // Clusters by Level
    const levels = [
        { id: 'G1', label: 'G1: Foundation (Core Standards)', color: '#1a5fb4', textColor: '#fff' },
        { id: 'G2', label: 'G2: Domain (Specialized Knowledge)', color: '#26a269', textColor: '#fff' },
        { id: 'G3', label: 'G3: Fragment (Snippets & Tools)', color: '#9a9996', textColor: '#fff' }
    ];

    levels.forEach(level => {
        const levelRules = rules.filter(r => r.level === level.id);
        if (levelRules.length > 0) {
            mermaid += `  subgraph ${level.id} ["${level.label}"]\n`;
            levelRules.forEach(r => {
                const title = (r.title || r.id).replace(/"/g, "'");
                // Use hexagonal for G1, rounded for G2, normal for G3
                const shape = level.id === 'G1' ? '{{' : (level.id === 'G2' ? '(' : '[');
                const closeShape = level.id === 'G1' ? '}}' : (level.id === 'G2' ? ')' : ']');
                
                mermaid += `    ${r.id.replace(/-/g, '_')}${shape}"<b>${r.id}</b><br/>${title}"${closeShape}\n`;
            });
            mermaid += '  end\n';
        }
    });

    // Edges
    rules.forEach(r => {
        if (r.depends_on && r.depends_on.length > 0) {
            r.depends_on.forEach(depId => {
                if (data.rules[depId]) {
                    mermaid += `  ${depId.replace(/-/g, '_')} --> ${r.id.replace(/-/g, '_')}\n`;
                }
            });
        }
    });

    // Styling
    mermaid += '\n  %% Styling\n';
    levels.forEach(level => {
        const levelRules = rules.filter(r => r.level === level.id);
        if (levelRules.length > 0) {
            const ids = levelRules.map(r => r.id.replace(/-/g, '_')).join(',');
            mermaid += `  classDef style_${level.id} fill:${level.color},stroke:#333,stroke-width:2px,color:${level.textColor},font-family:Arial;\n`;
            mermaid += `  class ${ids} style_${level.id};\n`;
        }
    });

    return mermaid;
}

const diagram = generateMermaid();
if (diagram) {
    console.log(diagram);
}
