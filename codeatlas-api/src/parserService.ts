import Parser from 'tree-sitter';
// @ts-ignore - tree-sitter-typescript does not ship with official type definitions yet
import tsLanguage from 'tree-sitter-typescript';
import fs from 'fs';

export function parseFileImports(filePath: string): string[] {
  // 1. Initialize the parser and set it to read TypeScript
  const parser = new Parser();
  parser.setLanguage(tsLanguage.typescript);

  // 2. Read the raw text of the file
  const sourceCode = fs.readFileSync(filePath, 'utf8');

  // 3. Generate the Abstract Syntax Tree (AST)
  const tree = parser.parse(sourceCode);

  const imports: string[] = [];

  // 4. A recursive function to walk through every node in the tree
  function walkNode(node: Parser.SyntaxNode) {
    // If the node is an import statement, find the module it is importing
    if (node.type === 'import_statement') {
      // Look for the string literal (e.g., 'express' in import ... from 'express')
      const sourceNode = node.children.find(child => child.type === 'string');
      if (sourceNode) {
        // Remove the quotes around the string and save it
        imports.push(sourceNode.text.replace(/['"]/g, ''));
      }
    }

    // Keep walking down the tree
    for (const child of node.children) {
      walkNode(child);
    }
  }

  // Start the walk from the very top (root) of the document
  walkNode(tree.rootNode);

  return imports;
}