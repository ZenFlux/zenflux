#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processDtsImports(distPath, searchPattern, replacePattern) {
    if (!fs.existsSync(distPath)) {
        console.log(`Directory ${distPath} does not exist, skipping import replacement.`);
        return;
    }

    const dtsFiles = [];

    function findDtsFiles(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                findDtsFiles(fullPath);
            } else if (item.endsWith('.d.ts')) {
                dtsFiles.push(fullPath);
            }
        }
    }

    findDtsFiles(distPath);

    let totalFiles = 0;
    let modifiedFiles = 0;

    for (const dtsFile of dtsFiles) {
        totalFiles++;
        try {
            const content = fs.readFileSync(dtsFile, 'utf8');
            const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
            const exportRegex = /export\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
            let modifiedContent = content;
            let hasChanges = false;

            // Process import statements
            modifiedContent = modifiedContent.replace(importRegex, (match, importPath) => {
                const newPath = importPath.replace(new RegExp(searchPattern, 'g'), replacePattern);
                if (newPath !== importPath) {
                    hasChanges = true;
                    return match.replace(importPath, newPath);
                }
                return match;
            });

            // Process export statements
            modifiedContent = modifiedContent.replace(exportRegex, (match, exportPath) => {
                const newPath = exportPath.replace(new RegExp(searchPattern, 'g'), replacePattern);
                if (newPath !== exportPath) {
                    hasChanges = true;
                    return match.replace(exportPath, newPath);
                }
                return match;
            });

            if (hasChanges) {
                fs.writeFileSync(dtsFile, modifiedContent, 'utf8');
                console.log(`Updated imports and exports in: ${path.relative(process.cwd(), dtsFile)}`);
                modifiedFiles++;
            }
        } catch (error) {
            console.error(`Failed to process ${dtsFile}:`, error);
        }
    }

    console.log(`Processed ${totalFiles} .d.ts files, modified ${modifiedFiles} files.`);
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
    console.log('Usage: node replace-imports.js <distPath> <searchPattern> <replacePattern>');
    console.log('Example: node replace-imports.js ./dist "@zenflux/package" "../package"');
    process.exit(1);
}

const [distPath, searchPattern, replacePattern] = args;

console.log(`Replacing imports in ${distPath}:`);
console.log(`  Search: ${searchPattern}`);
console.log(`  Replace: ${replacePattern}`);
console.log('');

processDtsImports(distPath, searchPattern, replacePattern);

