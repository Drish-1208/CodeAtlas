import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { cloneRepository } from './gitService';
import { parseFileImports } from './parserService';
import * as path from 'path';
import { getAllSourceFiles } from './fileScanner';
import { resolveImportPath } from './pathResolver';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'CodeAtlas API is running' });
});

// Ingestion Route
app.post('/api/ingest', async (req: Request, res: Response) => {
  const { repoUrl } = req.body;
  if (!repoUrl) {
    res.status(400).json({ error: 'Repository URL is required' });
    return;
  }
  
  try {
    console.log(`Starting analysis for: ${repoUrl}`);
    
    // 1. Clone the repository
    const repoPath = await cloneRepository(repoUrl);
    
    // 2. Scan the cloned directory for all valid source files
    const sourceFiles = getAllSourceFiles(repoPath);
    console.log(`Found ${sourceFiles.length} files to analyze.`);
    
    // 3. Create the dependency map
    // This object will look like: { "src/App.tsx": ["react", "./components/Button"] }
    const dependencyMap: Record<string, string[]> = {};
    
    // 4. Parse every file
    for (const filePath of sourceFiles) {
      try {
        const rawImports = parseFileImports(filePath);
        
        // Resolve the relative imports to their actual file paths
        const resolvedImports = rawImports.map(imp => 
          resolveImportPath(filePath, imp, sourceFiles)
        );
        
        const relativePath = filePath.replace(repoPath, '');
        
        // Ensure the resolved imports are also formatted as relative paths for the frontend
        const finalImports = resolvedImports.map(imp => 
          imp.startsWith(repoPath) ? imp.replace(repoPath, '') : imp
        );
        
        dependencyMap[relativePath] = finalImports;
        
      } catch (parseError) {
        // If one file is malformed, we log it but don't crash the whole process
        console.error(`Failed to parse file ${filePath}:`, parseError);
      }
    }
    
    res.status(200).json({ 
      message: 'Repository analyzed successfully', 
      totalFiles: sourceFiles.length,
      dependencies: dependencyMap 
    });
  } catch (error) {
    console.error('Ingestion failed:', error);
    res.status(500).json({ error: 'Failed to ingest and analyze repository' });
  }
});

// Temporary Test Route for File Scanner
app.get('/api/test-scanner', (req: Request, res: Response) => {
  try {
    // Point the scanner at our own src directory
    const targetDirectory = path.join(process.cwd(), 'src');
    
    const sourceFiles = getAllSourceFiles(targetDirectory);
    
    res.status(200).json({
      message: 'Directory successfully scanned!',
      totalFilesFound: sourceFiles.length,
      files: sourceFiles
    });
  } catch (error) {
    console.error('Scanning failed:', error);
    res.status(500).json({ error: 'Failed to scan directory' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});