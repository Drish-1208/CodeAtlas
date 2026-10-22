import { useState } from 'react';
import './App.css';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:4000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Analysis failed:", error);
      setResult({ error: "Failed to connect to the backend server." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>CodeAtlas Explorer</h1>
      <p>Paste a public GitHub URL to map its dependencies.</p>
      
      <form onSubmit={handleAnalyze} className="search-form">
        <input 
          type="url" 
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/Drish-1208/CodeAtlas.git" 
          required
          style={{ width: '300px', padding: '8px', marginRight: '10px' }}
        />
        <button type="submit" disabled={isLoading} style={{ padding: '8px 16px' }}>
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: '20px', textAlign: 'left', backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ color: '#fff' }}>Raw Dependency Map:</h3>
          <pre style={{ color: '#00ff00', overflowX: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;