import { useState, useMemo } from 'react';
import DependencyGraph from './DependencyGraph';
import './App.css';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setIsLoading(true);
    setResult(null);
    setSelectedNode(null);

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
    } finally {
      setIsLoading(false);
    }
  };

  // Generate dynamic metrics based on the backend data
  const metrics = useMemo(() => {
    if (!result?.dependencies) return { files: 0, deps: 0, internal: 0 };
    const depsMap = result.dependencies;
    const internalFiles = Object.keys(depsMap);
    const allDeps = Object.values(depsMap).flat();
    return {
      files: internalFiles.length,
      deps: allDeps.length,
      internal: internalFiles.filter(k => k.includes('/') || k.includes('\\')).length || internalFiles.length
    };
  }, [result]);

  const nodeDetails = useMemo(() => {
    if (!selectedNode || !result?.dependencies) return null;
    const outgoing = result.dependencies[selectedNode] || [];
    const incoming = Object.entries(result.dependencies)
      .filter(([_, imports]) => (imports as string[]).includes(selectedNode))
      .map(([source]) => source);
    return { incoming, outgoing };
  }, [selectedNode, result]);

  return (
    <div className="dashboard-layout">
      
      {/* TOP NAVIGATION */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo">⬡</span> CodeAtlas
        </div>
        <form onSubmit={handleAnalyze} className="search-form">
          <input 
            type="url" 
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="Enter GitHub Repository URL..." 
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Scanning...' : 'Analyze'}
          </button>
        </form>
      </header>

      {/* METRICS DASHBOARD */}
      {result && result.dependencies && (
        <div className="metrics-row">
          <div className="metric-card">
            <span className="metric-title">Files Analyzed</span>
            <span className="metric-value">{metrics.files}</span>
          </div>
          <div className="metric-card">
            <span className="metric-title">Total Dependencies</span>
            <span className="metric-value">{metrics.deps}</span>
          </div>
          <div className="metric-card">
            <span className="metric-title">Internal Modules</span>
            <span className="metric-value">{metrics.internal}</span>
          </div>
          <div className="metric-card">
            <span className="metric-title">External Packages</span>
            <span className="metric-value">{metrics.deps - metrics.internal > 0 ? metrics.deps - metrics.internal : 'N/A'}</span>
          </div>
        </div>
      )}

      {/* MAIN WORKSPACE */}
      {result && result.dependencies && (
        <div className="workspace">
          
          {/* Graph Area */}
          <div className="graph-container">
            <div className="graph-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#58a6ff' }}>⎈</span> Dependency map
              </div>
              <div className="legend">
                <div className="legend-item"><div className="dot-internal"></div> Internal file</div>
                <div className="legend-item"><div className="dot-external"></div> External package</div>
              </div>
            </div>
            
            <div style={{ flex: 1, position: 'relative' }}>
              <DependencyGraph data={result.dependencies} onNodeClick={setSelectedNode} />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="sidebar">
            {selectedNode ? (
              <>
                <div className="sidebar-header">
                  <span style={{ fontSize: '12px', color: '#8b949e', textTransform: 'uppercase' }}>Selected File</span>
                  <h3 style={{ margin: '8px 0 0 0', wordBreak: 'break-all', color: '#58a6ff' }}>
                    {selectedNode}
                  </h3>
                </div>

                <div className="sidebar-section">
                  <div className="sidebar-section-title">
                    Imports <span>({nodeDetails?.outgoing.length})</span>
                  </div>
                  <ul className="sidebar-list">
                    {nodeDetails?.outgoing.length === 0 ? <li>None</li> : 
                      nodeDetails?.outgoing.map(dep => (
                        <li key={dep} className="sidebar-list-item">
                          <span style={{ color: '#8b949e' }}>📄</span> {dep}
                        </li>
                    ))}
                  </ul>
                </div>

                <div className="sidebar-section">
                  <div className="sidebar-section-title">
                    Imported By <span>({nodeDetails?.incoming.length})</span>
                  </div>
                  <ul className="sidebar-list">
                    {nodeDetails?.incoming.length === 0 ? <li>None</li> : 
                      nodeDetails?.incoming.map(dep => (
                        <li key={dep} className="sidebar-list-item">
                          <span style={{ color: '#8b949e' }}>↳</span> {dep}
                        </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8b949e' }}>
                Select a node on the graph to view dependency details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;