const fs = require('fs');
const path = require('path');

const WIKI_DIR = 'wiki';
const ALLOWED_SUBDIRS = ['summaries', 'concepts', 'entities', 'syntheses', 'meta'];
const ALLOWED_ROOT_FILES = ['index.md', 'log.md', 'status.md'];

console.log('--- Starting Wiki Validation ---');

let errors = [];
let filesProcessed = 0;

if (!fs.existsSync(WIKI_DIR)) {
    console.error('Wiki directory not found');
    process.exit(1);
}

const rootList = fs.readdirSync(WIKI_DIR);
for (let i = 0; i < rootList.length; i++) {
    const entryName = rootList[i];
    const entryPath = path.join(WIKI_DIR, entryName);
    
    let isDir = false;
    try {
        if (ALLOWED_SUBDIRS.indexOf(entryName) !== -1) {
            fs.readdirSync(entryPath);
            isDir = true;
        }
    } catch (e) {
        isDir = false;
    }
    
    if (isDir) {
        const subList = fs.readdirSync(entryPath);
        for (let j = 0; j < subList.length; j++) {
            const fileName = subList[j];
            const filePath = path.join(entryPath, fileName);
            const relPath = path.join(entryName, fileName);
            
            filesProcessed++;
            validateContent(filePath, relPath);
        }
    } else {
        filesProcessed++;
        if (ALLOWED_ROOT_FILES.indexOf(entryName) === -1) {
            errors.push('[Location] File/Dir in wiki root not allowed: ' + entryName);
        }
        validateContent(entryPath, entryName);
    }
}

function validateContent(filePath, relativePath) {
    if (relativePath.endsWith('.md')) {
        const fileName = path.basename(filePath);
        const nameWithoutExt = fileName.substring(0, fileName.length - 3);
        if (!/^[a-z0-9-]+$/.test(nameWithoutExt)) {
            errors.push('[Naming] Invalid filename (must be lowercase-hyphenated): ' + relativePath);
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        
        if (!frontmatterMatch) {
            if (ALLOWED_ROOT_FILES.indexOf(relativePath) === -1) {
                errors.push('[Frontmatter] Missing YAML block: ' + relativePath);
            }
        } else {
            const fmText = frontmatterMatch[1];
            const required = ['title', 'type', 'tags', 'created', 'updated', 'sources', 'confidence'];
            for (let j = 0; j < required.length; j++) {
                const field = required[j];
                if (!new RegExp('^' + field + ':', 'm').test(fmText)) {
                    errors.push('[Frontmatter] Missing field "' + field + '": ' + relativePath);
                }
            }
            
            const confidenceMatch = fmText.match(/^confidence:\s*(.*)$/m);
            if (confidenceMatch) {
                const val = confidenceMatch[1].trim().toLowerCase();
                if (val !== 'high' && val !== 'medium' && val !== 'low') {
                    errors.push('[Frontmatter] Invalid confidence "' + confidenceMatch[1] + '" (must be High, Medium, or Low): ' + relativePath);
                }
            }
        }

        const linkRegex = /\[\[(.*?)\]\]/g;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const linkPath = match[1];
            let target = linkPath;
            if (target.indexOf('.md') === -1) {
                target = target + '.md';
            }
            
            // Check if link is to a file in root or a subdir
            const targetPath = path.join(WIKI_DIR, target);
            if (!fs.existsSync(targetPath)) {
                // Also check if target is a concept/entity/etc if no prefix provided
                const possibleSubdirs = ALLOWED_SUBDIRS;
                let found = false;
                for (const subdir of possibleSubdirs) {
                    const checkPath = subdir + '/' + target;
                    // Check local filesystem in sandbox
                    if (fs.existsSync(path.join('/workspace/user/every-content-wiki/wiki', checkPath))) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                   errors.push('[Links] Broken link [[' + linkPath + ']] in ' + relativePath);
                }
            }
        }
    }
}

console.log('Processed ' + filesProcessed + ' files.');
if (errors.length > 0) {
    console.log('\nValidation FAILED:');
    for (let k = 0; k < errors.length; k++) {
        console.log('  - ' + errors[k]);
    }
    process.exit(1);
} else {
    console.log('\nValidation PASSED successfully!');
}
