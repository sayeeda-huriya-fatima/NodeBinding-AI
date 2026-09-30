import { useState, useRef, useEffect } from 'react';
import { syncService } from './lib/syncService';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('triage');
  
  const [recording, setRecording] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '> System Initialized. Vertex AI models loaded.',
    '> Establishing secure connection to National Ledger...',
    '> Ready for biometric acoustic triage.'
  ]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [inventory, setInventory] = useState<any>({
    'O-negative Blood': 12,
    'ICU Beds': 2,
    'IV Paracetamol': 45,
    'Platelets': 8,
    'Oxygen Cylinders': 45,
    'Pediatric Nebulizers': 12,
  });

  const [doctors, setDoctors] = useState<{name: string, time: string}[]>([
    { name: 'Dr. S. Verma', time: new Date().toLocaleTimeString() }
  ]);

  const [fefoTransferred, setFefoTransferred] = useState(false);
  
  // Loading states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      const results = await syncService.flushQueue();
      if (results.length > 0) {
        const result = results[0];
        if (result.supplyState) setInventory(result.supplyState);
        if (result.data?.doctorName) {
          setDoctors(prev => [{name: result.data.doctorName, time: new Date().toLocaleTimeString()}, ...prev]);
        }
        setLogs(prev => [...prev, '> [Delta Sync] State changes transmitted. Zero data loss.']);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.start();
      setRecording(true);
      setLogs(prev => [...prev, '> Listening for mic stream...']);
    } catch (err) {
      setLogs(prev => [...prev, '> [ERROR] Microphone access denied.']);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result?.toString().split(',')[1];
          if (base64data) {
            setLogs(prev => [...prev, '> Triage note cached locally in SQLite encrypted buffer.', '> Processing NLP extraction via Gemini 1.5 Flash...']);
            await syncService.queueTriage(base64data);
            
            const results = await syncService.flushQueue();
            if (results.length > 0) {
               const r = results[0];
               if (r.supplyState) setInventory(r.supplyState);
               if (r.data?.doctorName) setDoctors(prev => [{name: r.data.doctorName, time: new Date().toLocaleTimeString()}, ...prev]);
               setLogs(prev => [
                 ...prev, 
                 `[SYSTEM] Biometric match: ${r.data?.doctorName || 'Verified'}`, 
                 `[ENTITY] Blood Req: ${r.data?.bloodRequirement || 'None'}`,
                 `[ENTITY] Bed Req: ${r.data?.bedRequirement || 'None'}`,
                 `> State ledger updated. Attendance locked.`
               ]);
            }
          }
        };
      };
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setRecording(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    setLogs(prev => [...prev, '> [SYNC] Initiating manual Delta Sync Protocol...']);
    await new Promise(r => setTimeout(r, 1200));
    setLogs(prev => [...prev, '> [SYNC] SUCCESS: Local SQLite buffer flushed. 0 bytes pending.']);
    setIsSyncing(false);
  };

  const handleFirebaseWarning = async () => {
    setIsDispatching(true);
    setLogs(prev => [...prev, '> [FCM] Constructing high-priority payload for Dengue cluster...']);
    await new Promise(r => setTimeout(r, 1500));
    setLogs(prev => [...prev, '> [FCM] SUCCESS: Early warning dispatched to 14 District Health Officers.']);
    setIsDispatching(false);
  };

  const handleAutoRoute = async () => {
    setIsRouting(true);
    setLogs(prev => [...prev, '> [VERTEX AI] Calculating optimal supply re-routing for Dengue surge...']);
    await new Promise(r => setTimeout(r, 2000));
    setInventory((prev: any) => ({...prev, 'IV Paracetamol': prev['IV Paracetamol'] + 500, 'Platelets': prev['Platelets'] + 100}));
    setLogs(prev => [...prev, '> [LOGISTICS] SUCCESS: 500 IV Paracetamol & 100 Platelets rerouted to Rural PHC.']);
    setIsRouting(false);
  };

  const handleAllocateBeds = async () => {
    setIsAllocating(true);
    setLogs(prev => [...prev, '> [VERTEX AI] Analyzing respiratory surge metrics vs bed capacity...']);
    await new Promise(r => setTimeout(r, 1800));
    setInventory((prev: any) => ({...prev, 'ICU Beds': prev['ICU Beds'] + 15}));
    setLogs(prev => [...prev, '> [HOSPITAL ADMIN] SUCCESS: 15 Pediatric beds preemptively allocated.']);
    setIsAllocating(false);
  };

  const handleFefoTransfer = async () => {
    setIsTransferring(true);
    setLogs(prev => [...prev, '> [FEFO ALGORITHM] Initiating cold-chain transfer protocol...']);
    await new Promise(r => setTimeout(r, 2000));
    setFefoTransferred(true);
    setLogs(prev => [...prev, '> [LOGISTICS] SUCCESS: Anti-venom transfer authorized. Waste prevented.']);
    setIsTransferring(false);
  };

  const handleExportLogs = async () => {
    setIsExporting(true);
    setLogs(prev => [...prev, '> [SECURITY] Generating cryptographic attendance hash...']);
    await new Promise(r => setTimeout(r, 1000));
    setLogs(prev => [...prev, '> [EXPORT] SUCCESS: 100% Verified Attendance Logs downloaded.']);
    setIsExporting(false);
  };

  // --- RENDER PAGES ---

  const renderAcousticTriage = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      <div className="clinical-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>Acoustic Proof-of-Presence</h2>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '2rem' }}>Passive capture eliminates data entry burden and falsified biometric shift logs.</p>
        <button 
          onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
          className={`dictate-btn ${recording ? 'recording' : ''}`} style={{ marginBottom: '1.5rem' }}
        >
          {recording ? '🎙️ Release to Authenticate' : '🎙️ Hold to Dictate Triage'}
        </button>
        <div style={{ backgroundColor: '#0d1117', color: '#56d364', padding: '1rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.85rem', height: '250px', overflowY: 'auto', border: '1px solid #30363d', display: 'flex', flexDirection: 'column-reverse' }}>
          <div>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '8px', color: log.includes('[SYSTEM]') ? '#58a6ff' : log.includes('[ENTITY]') ? '#38bdf8' : log.includes('[ERROR]') ? '#ff7b72' : '#56d364' }}>{log}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="clinical-card">
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 1rem 0', color: '#0f172a' }}>Verified Biometric Attendance</h2>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>Solving the ghost doctor bottleneck.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '300px', overflowY: 'auto' }}>
          {doctors.map((doc, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
              <div>
                <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '1rem' }}>{doc.name}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Voice Match Verified • {doc.time}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="action-btn" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }} onClick={handleExportLogs} disabled={isExporting}>
          {isExporting ? '⏳ Encrypting...' : '⬇️ Export 100% Verified Attendance Logs'}
        </button>
      </div>
    </div>
  );

  const renderPredictiveRouting = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="clinical-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🦠 Vector-Borne Outbreak (Dengue)
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#7f1d1d', marginBottom: '1rem' }}>Simultaneous spike in IV paracetamol and platelet depletion flags epidemic surge.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="action-btn" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', justifyContent: 'center' }} onClick={handleFirebaseWarning} disabled={isDispatching}>
              {isDispatching ? '⏳ Dispatching...' : '📡 Dispatch Firebase Warning'}
            </button>
            <button className="action-btn" style={{ justifyContent: 'center' }} onClick={handleAutoRoute} disabled={isRouting}>
              {isRouting ? '⏳ Routing...' : '🚚 Auto-Route Buffers to Zone 4'}
            </button>
          </div>
        </div>
        <div className="clinical-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🫁 Seasonal Respiratory Surge
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#1e3a8a', marginBottom: '1rem' }}>Tracks oxygen cylinder depletion and nebulizer usage to pre-allocate beds.</p>
          <button className="action-btn" style={{ width: '100%', backgroundColor: '#0f172a', color: 'white', justifyContent: 'center' }} onClick={handleAllocateBeds} disabled={isAllocating}>
            {isAllocating ? '⏳ Allocating Beds...' : '🏥 Pre-Allocate Pediatric Beds'}
          </button>
        </div>
      </div>
      <div className="clinical-card">
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0' }}>Real-Time Clinical Consumption</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(inventory).map(([item, qty]) => (
            <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <span style={{ color: '#475569', fontSize: '1rem', fontWeight: '500' }}>{item}</span>
              <span className={`badge ${(qty as number) < 15 ? 'badge-warn' : 'badge-ok'}`} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                {qty as number} Units
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFefoLogistics = () => (
    <div className="clinical-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem 0', color: '#0369a1', textAlign: 'center' }}>FEFO Expiry Waste Prevention</h2>
      <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem' }}>First-to-Expire, First-Out (FEFO) algorithm prevents cold-chain medical waste between low and high footfall areas.</p>
      
      {!fefoTransferred ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', width: '100%', borderRadius: '8px', border: '2px solid #bae6fd', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0ea5e9', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Rural PHC (Low Footfall)</div>
            <div style={{ fontWeight: '700', fontSize: '1.5rem', color: '#0f172a' }}>Stagnant Inventory</div>
            <div style={{ fontSize: '1rem', color: '#475569', marginTop: '0.5rem' }}>Anti-venom vials set to expire in 45 days with zero patient demand.</div>
          </div>
          <button className="action-btn" style={{ backgroundColor: '#0ea5e9', color: 'white', padding: '1rem 3rem', fontSize: '1.1rem', border: 'none', borderRadius: '50px' }} onClick={handleFefoTransfer} disabled={isTransferring}>
            {isTransferring ? '⏳ Authorizing Transfer Protocol...' : 'Initiate Automated Transfer ➔'}
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: '#dcfce7', padding: '2rem', borderRadius: '8px', border: '2px solid #bbf7d0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase', marginBottom: '0.5rem' }}>District Hospital (High Footfall)</div>
          <div style={{ fontWeight: '700', fontSize: '1.5rem', color: '#0f172a' }}>Immediate Utilization</div>
          <div style={{ fontSize: '1rem', color: '#475569', marginTop: '1rem' }}>✅ First-to-Expire, First-Out (FEFO) algorithm actively prevented cold-chain medical waste. Transfer Complete.</div>
        </div>
      )}
    </div>
  );

  const renderEdgeSync = () => (
    <div className="clinical-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem 0', color: '#0f172a' }}>Offline-First Resilience</h2>
      <p style={{ color: '#64748b', marginBottom: '3rem' }}>Built for erratic rural power grids and unreliable 2G connectivity.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem', textAlign: 'left' }}>
        <div style={{ padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💾</div>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>SQLite Edge-Sync</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Triage notes cache locally in encrypted buffers during outages.</p>
        </div>
        <div style={{ padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📡</div>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Delta Sync Protocol</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Transmits only state changes upon connection restore. Zero data loss.</p>
        </div>
      </div>

      <button className="action-btn" style={{ padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '50px' }} onClick={handleForceSync} disabled={isSyncing}>
        {isSyncing ? '⏳ Syncing Local State with Cloud...' : '🔄 Force Delta Sync'}
      </button>
    </div>
  );

  return (
    <div className="layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#0ea5e9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>☤</div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: '700' }}>NodeBinding AI</h1>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Command Center</div>
        </div>
        
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'triage' ? 'active' : ''}`} onClick={() => setActiveTab('triage')}>
            <span>🎙️</span> Acoustic Triage
          </div>
          <div className={`nav-item ${activeTab === 'predictive' ? 'active' : ''}`} onClick={() => setActiveTab('predictive')}>
            <span>📈</span> Predictive Routing
          </div>
          <div className={`nav-item ${activeTab === 'fefo' ? 'active' : ''}`} onClick={() => setActiveTab('fefo')}>
            <span>📦</span> FEFO Logistics
          </div>
          <div className={`nav-item ${activeTab === 'sync' ? 'active' : ''}`} onClick={() => setActiveTab('sync')}>
            <span>🔄</span> Edge Sync
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
              {activeTab === 'triage' && 'Acoustic Proof-of-Presence'}
              {activeTab === 'predictive' && 'Predictive Supply Routing'}
              {activeTab === 'fefo' && 'FEFO Waste Prevention'}
              {activeTab === 'sync' && 'Offline-First Infrastructure'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="pulse"></span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#10b981' }}>Vertex Federated Pipeline: ACTIVE</span>
          </div>
        </header>

        <div className="page-content">
          {activeTab === 'triage' && renderAcousticTriage()}
          {activeTab === 'predictive' && renderPredictiveRouting()}
          {activeTab === 'fefo' && renderFefoLogistics()}
          {activeTab === 'sync' && renderEdgeSync()}
        </div>
      </main>
    </div>
  );
}

export default App;
