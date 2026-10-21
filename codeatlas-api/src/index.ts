import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { cloneRepository } from './gitService';
import { parseFileImports } from './parserService';
import * as path from 'path';
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
    const repoPath = await cloneRepository(repoUrl);
    res.status(200).json({ 
      message: 'Repository cloned successfully', 
      path: repoPath 
    });
  } catch (error) {
    console.error('Clone failed:', error);
    res.status(500).json({ error: 'Failed to clone repository' });
  }
});;

// Temporary Test Route for Tree-sitter
app.get('/api/test-parser', (req: Request, res: Response) => {
  try {
    // We will tell Tree-sitter to parse this exact file (index.ts)
    const filePath = path.join(process.cwd(), 'src', 'index.ts');
    
    const imports = parseFileImports(filePath);
    
    res.status(200).json({
      message: 'Tree-sitter successfully parsed the file!',
      file: 'src/index.ts',
      extractedImports: imports
    });
  } catch (error) {
    console.error('Parsing failed:', error);
    res.status(500).json({ error: 'Failed to parse file' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});