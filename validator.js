const fs = require('fs');
const path = require('path');

const WIKI_DIR = 'wiki';
const ALLOWED_SUBDIRS = ['summaries', 'concepts', 'entities', 'syntheses', 'meta'];
const ALLOWED_ROOT_FILES = ['index.md', 'log.md', 'status.md'];
const STATUS_FILE = 'wiki/status.md';

console.log('--- Starting Advanced Wiki Validation ---');

let errors = [];
let warnings = [];
let filesProcessed = 0;
let allFiles = [];
let linksFound = new Set();
let stats = {
    summaries: 0,
    concepts: 0,
    entities: 0,
    syntheses: 0,
    meta: 0,
    root: 0
};

// Manually list directories to scan to ensure all levels are covered
const dirsToScan = ALLOWED_SUBDIRS.map(d => path.join(WIKI_DIR, d)).concat([WIKI_DIR]);

for (const dir of dirsToScan) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir);
    for (const name of entries) {
        const fullPath = path.join(dir, name);
        
        if (name.endsWith('.md')) {
            const relPath = path.relative(WIKI_DIR, fullPath);
            const parent = path.basename(path.dirname(fullPath));
            
            if (parent === WIKI_DIR) {
                stats.root++;
                if (!ALLOWED_ROOT_FILES.includes(name)) {
                    errors.push(`[Location] File in root not allowed: ${name}`);
                }
            } else if (ALLOWED_SUBDIRS.includes(parent)) {
                stats[parent]++;
            } else {
                errors.push(`[Location] Unauthorized location: ${relPath}`);
            }

            allFiles.push(relPath);
            validateFile(fullPath, relPath);
        }
    }
}

function validateFile(filePath, relativePath) {
    filesProcessed++;
    const content = fs.readFileSync(filePath, 'utf8');

    // 1. Naming: lowercase and hyphens only
    const fileName = path.basename(filePath);
    const nameWithoutExt = fileName.substring(0, fileName.length - 3);
    if (!/^[a-z0-9-]+$/.test(nameWithoutExt)) {
        errors.push(`[Naming] Invalid filename: ${relativePath}`);
    }

    // 2. YAML Schema Enforcement
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) {
        if (!ALLOWED_ROOT_FILES.includes(relativePath)) {
            errors.push(`[Frontmatter] Missing YAML: ${relativePath}`);
        }
    } else {
        const fm = frontmatterMatch[1];
        const required = ['title', 'type', 'tags', 'created', 'updated', 'sources', 'confidence'];
        required.forEach(f => {
            if (!new RegExp(`^${f}:`, 'm').test(fm)) errors.push(`[Frontmatter] Missing ${f}: ${relativePath}`);
        });
        const conf = fm.match(/^confidence:\s*(.*)$/m);
        if (conf && !['High', 'Medium', 'Low'].includes(conf[1].trim())) {
            errors.push(`[Frontmatter] Invalid confidence "${conf[1].trim()}" (must be High, Medium, or Low): ${relativePath}`);
        }
    }

    // 3. Lazy Pattern Detection
    if (/\.\.\./.test(content)) warnings.push(`[Lazy] Ellipsis in ${relativePath}`);
    if (/\betc\b/i.test(content)) warnings.push(`[Lazy] 'etc' in ${relativePath}`);
    if (/\btbd\b/i.test(content)) warnings.push(`[Lazy] 'TBD' in ${relativePath}`);
    if (/\[placeholder\]/i.test(content)) warnings.push(`[Lazy] Placeholder in ${relativePath}`);

    // 4. Broken Link Validation
    const linkRegex = /\[\[(.*?)\]\]/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
        let t = match[1];
        if (!t.endsWith('.md')) t += '.md';
        linksFound.add(t);
        let f = fs.existsSync(path.join(WIKI_DIR, t));
        if (!f) {
            for (const s of ALLOWED_SUBDIRS) {
                if (fs.existsSync(path.join(WIKI_DIR, s, t))) { f = true; break; }
            }
        }
        if (!f) errors.push(`[Links] Broken link [[${match[1]}]] in ${relativePath}`);
    }
}

// Orphan Link Validation (checking if files are not linked from anywhere)
allFiles.forEach(f => {
    if (f === 'index.md') return; // index is the entry point
    let linked = false;
    for (const l of linksFound) {
        // Match exact path or just the filename for flexible linking
        if (l === f || (f.includes(path.sep) && l === path.basename(f))) { 
            linked = true; 
            break; 
        }
    }
    if (!linked) warnings.push(`[Orphan] Unlinked: ${f}`);
});

// Coverage Sync Validation (verify wiki/status.md totals)
if (fs.existsSync(STATUS_FILE)) {
    const sc = fs.readFileSync(STATUS_FILE, 'utf8');
    const m = sc.match(/\|\s*\*\*Total\*\*\s*\|\s*\*\*(\d+)\*\*\s*\|\s*\*\*(\d+)\*\*\s*\|\s*\*\*(\d+)\*\*\s*\|/);
    if (m) {
        const actualSum = stats.summaries;
        const actualInd = stats.concepts + stats.entities + stats.syntheses;
        if (parseInt(m[2]) !== actualSum) errors.push(`[Sync] Summary mismatch: status=${m[2]}, disk=${actualSum}`);
        if (parseInt(m[3]) !== actualInd) errors.push(`[Sync] Index mismatch: status=${m[3]}, disk=${actualInd}`);
    }
}

console.log(`Processed ${filesProcessed} files.`);
if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.log(`  ! ${w}`));
}
if (errors.length > 0) {
    console.log('\nValidation FAILED:');
    errors.forEach(e => console.log(`  - ${e}`));
    process.exit(1);
} else {
    console.log('\nValidation PASSED successfully!');
}
