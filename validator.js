const fs = require('fs');
const path = require('path');

const WIKI_DIR = 'wiki';
const ALLOWED_SUBDIRS = ['summaries', 'concepts', 'entities', 'syntheses'];
const ALLOWED_ROOT_FILES = ['index.md', 'log.md'];

console.log('--- Starting Wiki Validation ---');

let errors = [];
let filesProcessed = 0;

const rootList = fs.readdirSync(WIKI_DIR);
for (let i = 0; i < rootList.length; i++) {
    const rootName = rootList[i];
    const rootPath = path.join(WIKI_DIR, rootName);
    
    let isDir = false;
    try {
        fs.readdirSync(rootPath);
        isDir = true;
    } catch (e) {
        isDir = false;
    }
    
    if (isDir) {
        const subList = fs.readdirSync(rootPath);
        for (let j = 0; j < subList.length; j++) {
            const fileName = subList[j];
            const filePath = path.join(rootPath, fileName);
            const relPath = path.join(rootName, fileName);
            
            filesProcessed++;
            const parts = relPath.split(path.sep);
            if (ALLOWED_SUBDIRS.indexOf(parts[0]) === -1) {
                errors.push('[Location] File in unauthorized subdirectory: ' + relPath);
            }
            validateContent(filePath, relPath);
        }
    } else {
        filesProcessed++;
        if (ALLOWED_ROOT_FILES.indexOf(rootName) === -1) {
            errors.push('[Location] File in wiki root not allowed: ' + rootName);
        }
        validateContent(rootPath, rootName);
    }
}

function validateContent(filePath, relativePath) {
    const fileName = path.basename(filePath);
    if (fileName.indexOf('.md') !== -1) {
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
            const targetPath = path.join(WIKI_DIR, target);
            if (!fs.existsSync(targetPath)) {
                errors.push('[Links] Broken link [[' + linkPath + ']] in ' + relativePath);
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
