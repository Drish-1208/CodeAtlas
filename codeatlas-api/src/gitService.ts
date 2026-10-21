import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';

export async function cloneRepository(repoUrl: string): Promise<string> {
  // Create a unique temporary directory for the clone
  const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repo';
  const timestamp = Date.now();
  const targetDir = path.join(__dirname, '..', 'cloned_repos', `${repoName}-${timestamp}`);

  console.log(`Starting clone of ${repoUrl} into ${targetDir}...`);

  await git.clone({
    fs,
    http,
    dir: targetDir,
    url: repoUrl,
    singleBranch: true,
    depth: 1 // Shallow clone to save time and space
  });

  console.log('Clone complete!');
  return targetDir;
}