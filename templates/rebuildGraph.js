const fs = require('fs');
const path = require('path');
const os = require('os');

const GLOBAL_DIR = process.env.ASSA_GLOBAL_DIR || path.join(os.homedir(), '.gemini', 'assa');
const LIBRARY_DIR = process.env.ASSA_LIBRARY_DIR || path.join(GLOBAL_DIR, 'LIBRARY');

function parseFrontmatter(content) {
    const match = content.match(/^---([\s\S]+?)---/);
    if (!match) return null;
    const yaml = match[1];
    const data = {};
    yaml.split('\n').forEach(line => {
        const [key, ...val] = line.split(':');
        if (key && val.length > 0) {
            let v = val.join(':').trim();
            if (v.startsWith('[') && v.endsWith(']')) {
                v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1'));
            } else {
                v = v.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
            }
            data[key.trim()] = v;
        }
    });
    return data;
}

function rebuild() {
    console.log('--- ASSA WEAVER: Rebuilding Global Graph ---');
    if (!fs.existsSync(LIBRARY_DIR)) {
        console.error(`Error: Library directory not found at ${LIBRARY_DIR}`);
        return;
    }
    
    const files = fs.readdirSync(LIBRARY_DIR).filter(f => f.endsWith('.md'));
    const rules = {};
    const indexMappings = [];
    let hasError = false;

    files.forEach(file => {
        const content = fs.readFileSync(path.join(LIBRARY_DIR, file), 'utf8');
        const meta = parseFrontmatter(content);
        if (meta && meta.id) {
            if (rules[meta.id]) {
                console.error(`Error: Duplicate ID detected: ${meta.id} (found in ${file} and ${rules[meta.id].path})`);
                hasError = true;
                return;
            }
            rules[meta.id] = {
                id: meta.id,
                path: `LIBRARY/${file}`,
                level: meta.level || 'G3',
                rationale: meta.rationale || '',
                depends_on: meta.depends_on || [],
                evolution_version: meta.evolution_version || '3.5',
                triggers: meta.triggers || []
            };
            if (meta.triggers && Array.isArray(meta.triggers)) {
                indexMappings.push({
                    domains: meta.triggers,
                    rule_id: meta.id
                });
            }
        }
    });

    if (hasError) {
        process.exit(1);
    }

    // Broken Link Detection
    Object.values(rules).forEach(rule => {
        rule.depends_on.forEach(depId => {
            if (!rules[depId]) {
                console.warn(`Warning: Rule ${rule.id} depends on missing rule: ${depId}`);
            }
        });
    });

    // Write graph.json
    fs.writeFileSync(path.join(GLOBAL_DIR, 'graph.json'), JSON.stringify({ version: "3.5", rules }, null, 2));
    // Write index.json (inside LIBRARY to keep it with the data)
    fs.writeFileSync(path.join(LIBRARY_DIR, 'index.json'), JSON.stringify({ version: "3.5", mappings: indexMappings }, null, 2));
    
    console.log(`Success: Indexed ${Object.keys(rules).length} rules.`);
}

if (require.main === module) rebuild();
