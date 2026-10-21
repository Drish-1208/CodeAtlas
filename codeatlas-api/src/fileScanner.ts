import fs from 'fs';
import path from 'path';

// We do not want to parse compiled code or third-party libraries
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '.next']);
const VALID_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

export function getAllSourceFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      // If it is a directory we should ignore, skip it entirely
      if (!IGNORE_DIRS.has(file)) {
        getAllSourceFiles(fullPath, arrayOfFiles);
      }
    } else {
      // If it is a file, check if it has a valid extension before saving it
      const ext = path.extname(file);
      if (VALID_EXTENSIONS.has(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}