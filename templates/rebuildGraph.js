const fs = require('fs');
const path = require('path');
const os = require('os');

const GLOBAL_DIR = path.join(os.homedir(), '.gemini', 'assa');
const LIBRARY_DIR = path.join(GLOBAL_DIR, 'LIBRARY');

/**
 * Robust YAML Frontmatter Parser
 * Handles colons in values and basic array parsing.
 */
function parseFrontmatter(content, fileName) {
    const match = content.match(/^---([\s\S]+?)---/);
    if (!match) return null;
    
    const yaml = match[1];
    const data = {};
    const lines = yaml.split('\n');
    
    lines.forEach(line => {
        // Match key: value (value can contain colons)
        const pairMatch = line.match(/^([^:]+):\s*([\s\S]*)$/);
        if (pairMatch) {
            const key = pairMatch[1].trim();
            let v = pairMatch[2].trim();
            
            // Array parsing [item1, item2]
            if (v.startsWith('[') && v.endsWith(']')) {
                v = v.slice(1, -1).split(',')
                    .map(s => s.trim().replace(/^["'](.*)["']$/, '$1'))
                    .filter(s => s !== "");
            } else {
                // Remove wrapping quotes
                v = v.replace(/^["'](.*)["']$/, '$1');
            }
            data[key] = v;
        }
    });
    return data;
}

function rebuild() {
    console.log('--- ASSA WEAVER: Rebuilding Global Graph (V3.5 Robust) ---');
    if (!fs.existsSync(LIBRARY_DIR)) {
        console.error(`Error: Library directory not found at ${LIBRARY_DIR}`);
        return;
    }
    
    const files = fs.readdirSync(LIBRARY_DIR).filter(f => f.endsWith('.md'));
    const rules = {};
    const indexMappings = [];
    const idToFileMap = {};

    // Phase 1: Parsing and Collision Detection
    files.forEach(file => {
        const content = fs.readFileSync(path.join(LIBRARY_DIR, file), 'utf8');
        const meta = parseFrontmatter(content, file);
        
        if (meta && meta.id) {
            // ID Collision Detection
            if (idToFileMap[meta.id]) {
                console.error(`CRITICAL ERROR: ID Collision detected! ID "${meta.id}" is used in both: \n  1. ${idToFileMap[meta.id]}\n  2. ${file}\nAborting build to prevent graph corruption.`);
                process.exit(1);
            }
            idToFileMap[meta.id] = file;

            rules[meta.id] = {
                id: meta.id,
                path: `LIBRARY/${file}`,
                level: meta.level || 'G3',
                rationale: meta.rationale || '',
                depends_on: Array.isArray(meta.depends_on) ? meta.depends_on : [],
                evolution_version: meta.evolution_version || '3.5',
                triggers: Array.isArray(meta.triggers) ? meta.triggers : []
            };

            if (rules[meta.id].triggers.length > 0) {
                indexMappings.push({
                    domains: rules[meta.id].triggers,
                    rule_id: meta.id
                });
            }
        }
    });

    // Phase 2: Broken Link Detection
    let brokenLinksCount = 0;
    Object.values(rules).forEach(rule => {
        rule.depends_on.forEach(depId => {
            if (depId && !rules[depId]) {
                console.warn(`WARNING: Broken dependency in ${rule.path}: Rule "${rule.id}" depends on missing rule "${depId}".`);
                brokenLinksCount++;
            }
        });
    });

    // Phase 3: Writing Results
    try {
        fs.writeFileSync(path.join(GLOBAL_DIR, 'graph.json'), JSON.stringify({ 
            version: "3.5", 
            last_rebuild: new Date().toISOString(),
            stats: { rules: Object.keys(rules).length, broken_links: brokenLinksCount },
            rules 
        }, null, 2));
        
        fs.writeFileSync(path.join(LIBRARY_DIR, 'index.json'), JSON.stringify({ 
            version: "3.5", 
            mappings: indexMappings 
        }, null, 2));
        
        console.log(`Success: Indexed ${Object.keys(rules).length} rules. (Found ${brokenLinksCount} broken links)`);
    } catch (err) {
        console.error(`Error writing graph files: ${err.message}`);
        process.exit(1);
    }
}

if (require.main === module) rebuild();

