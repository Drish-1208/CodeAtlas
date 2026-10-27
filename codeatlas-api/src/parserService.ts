import Parser from 'tree-sitter';
import tsLanguage from 'tree-sitter-typescript';
import fs from 'fs';
import path from 'path';

const parser = new Parser();

export function parseFileImports(filePath: string): string[] {
  const ext = path.extname(filePath);
  const code = fs.readFileSync(filePath, 'utf-8');
  const imports: string[] = [];

  try {
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      // TypeScript/JavaScript still uses Tree-sitter for accuracy
      parser.setLanguage(tsLanguage.tsx);
      const tree = parser.parse(code);
      extractTSImports(tree.rootNode, imports);
    } 
    else if (ext === '.py') {
      // Pure Regex fallback for Python
      const fromRegex = /^from\s+([a-zA-Z0-9_.]+)/gm;
      const importRegex = /^import\s+([a-zA-Z0-9_.,\s]+)/gm;
      
      let match;
      while ((match = fromRegex.exec(code)) !== null) {
        imports.push(match[1]);
      }
      while ((match = importRegex.exec(code)) !== null) {
        const modules = match[1].split(',').map(m => m.trim().split(/\s+/)[0]);
        imports.push(...modules);
      }
    } 
    else if (['.cpp', '.hpp', '.c', '.h'].includes(ext)) {
      // Pure Regex fallback for C/C++
      const includeRegex = /^#include\s+[<"]([^>"]+)[>"]/gm;
      let match;
      while ((match = includeRegex.exec(code)) !== null) {
        imports.push(match[1]);
      }
    }
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error);
  }

  return Array.from(new Set(imports)); // Deduplicate
}

// TS extraction helper
function extractTSImports(node: any, imports: string[]) {
  if (!node) return;
  if (node.type === 'import_statement') {
    const sourceNode = node.children.find((c: any) => c.type === 'string');
    if (sourceNode) imports.push(sourceNode.text.replace(/['"]/g, ''));
  }
  for (const child of node.children || []) extractTSImports(child, imports);
}