import path from 'path';

export function resolveImportPath(
  sourceFilePath: string, 
  rawImport: string, 
  allScannedFiles: string[]
): string {
  // If it is an external package like 'react' or 'express', leave it alone
  if (!rawImport.startsWith('.')) {
    return rawImport;
  }

  // 1. Find the folder of the file doing the importing
  const sourceDir = path.dirname(sourceFilePath);
  
  // 2. Calculate what the absolute path should be (without the .ts/.js extension)
  const targetPath = path.join(sourceDir, rawImport);

  // 3. Search our master list of scanned files for a match
  const matchedFile = allScannedFiles.find(file => {
    // Remove the extension from the scanned file so we can match it against the import string
    const fileWithoutExt = file.replace(/\.[^/.]+$/, "");
    return fileWithoutExt === targetPath;
  });

  // If we found the actual file on disk, return its true path. Otherwise, return the raw string.
  return matchedFile ? matchedFile : rawImport;
}