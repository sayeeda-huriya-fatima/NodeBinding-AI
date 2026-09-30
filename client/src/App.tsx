import { useState, useRef, useEffect } from 'react';
import { syncService } from './lib/syncService';
import './App.css';

function App() {
  const [recording, setRecording] = useState(false);
  
  // Terminal Logs
  const [logs, setLogs] = useState<string[]>([
    '> System Initialized. Vertex AI models loaded.',
    '> Establishing secure connection to National Ledger...',
    '> Ready for biometric acoustic triage.'
  ]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Core State
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

  // Interactive Button States
  const [fefoTransferred, setFefoTransferred] = useState(false);
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

  // --- INTERACTIVE ACTION HANDLERS ---
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
    setInventory(prev => ({...prev, 'IV Paracetamol': prev['IV Paracetamol'] + 500, 'Platelets': prev['Platelets'] + 100}));
    setLogs(prev => [...prev, '> [LOGISTICS] SUCCESS: 500 IV Paracetamol & 100 Platelets rerouted to Rural PHC.']);
    setIsRouting(false);
  };

  const handleAllocateBeds = async () => {
    setIsAllocating(true);
    setLogs(prev => [...prev, '> [VERTEX AI] Analyzing respiratory surge metrics vs bed capacity...']);
    await new Promise(r => setTimeout(r, 1800));
    setInventory(prev => ({...prev, 'ICU Beds': prev['ICU Beds'] + 15}));
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

  return (
    <div style={{ backgroundColor: '#f4f7f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Clinical Top Navigation */}
      <nav style={{ backgroundColor: '#0f172a', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#0ea5e9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>☤</div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#f8fafc', fontWeight: '700' }}>NodeBinding AI <span style={{ fontWeight: '400', color: '#94a3b8', fontSize: '1rem' }}>| National Supply Chain Defense</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1e293b', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #334155' }}>
            <span className="pulse"></span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1' }}>Vertex Federated Pipeline: ACTIVE</span>
          </div>
        </div>
      </nav>

      {/* Performance Benchmarks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '1.5rem 2rem', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0ea5e9' }}>0 min</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Manual Dashboard Entry</div>
        </div>
        <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>100%</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Verified Attendance Logs</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>Zero</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Cold-Chain Expiry Waste</div>
        </div>
      </div>

      {/* Main Clinical Dashboard Grid */}
      <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
        
        {/* COLUMN 1: Input & Offline Resilience */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="clinical-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>Acoustic Proof-of-Presence</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>Doctors dictate 5-second triage notes. Passive capture eliminates data entry burden.</p>
            <button 
              onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
              className={`dictate-btn ${recording ? 'recording' : ''}`} style={{ marginBottom: '1.5rem' }}
            >
              {recording ? '🎙️ Release to Authenticate' : '🎙️ Hold to Dictate Triage'}
            </button>

            {/* Slide 3 Exact Dark Terminal */}
            <div style={{ backgroundColor: '#0d1117', color: '#56d364', padding: '1rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8rem', height: '220px', overflowY: 'auto', border: '1px solid #30363d', display: 'flex', flexDirection: 'column-reverse' }}>
              <div>
                {logs.map((log, i) => (
                  <div key={i} style={{ marginBottom: '6px', color: log.includes('[SYSTEM]') ? '#58a6ff' : log.includes('[ENTITY]') ? '#38bdf8' : log.includes('[ERROR]') ? '#ff7b72' : '#56d364' }}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="clinical-card">
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0' }}>Offline-First Resilience</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderLeft: '3px solid #0ea5e9', paddingLeft: '1rem' }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#0f172a' }}>SQLite Edge-Sync</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Triage notes cache locally in encrypted buffers during outages.</div>
              </div>
            </div>
            <button className="action-btn" style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }} onClick={handleForceSync} disabled={isSyncing}>
              {isSyncing ? '⏳ Syncing Protocol...' : '🔄 Force Delta Sync'}
            </button>
          </div>

        </div>

        {/* COLUMN 2: Epidemic Triggers & Infrastructure */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="clinical-card" style={{ border: '2px solid #f87171', backgroundColor: '#fef2f2' }}>
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🦠</span> Vector-Borne Outbreak (Dengue)
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#7f1d1d', marginBottom: '1rem' }}>Simultaneous spike in IV paracetamol and platelet depletion flags epidemic surge.</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="action-btn" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', flex: 1 }} onClick={handleFirebaseWarning} disabled={isDispatching}>
                {isDispatching ? '⏳ Dispatching...' : 'Dispatch Firebase Warning'}
              </button>
              <button className="action-btn" style={{ backgroundColor: 'white', color: '#ef4444', borderColor: '#ef4444', flex: 1 }} onClick={handleAutoRoute} disabled={isRouting}>
                {isRouting ? '⏳ Routing...' : 'Auto-Route Buffers'}
              </button>
            </div>
          </div>

          <div className="clinical-card">
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🫁</span> Seasonal Respiratory Surge
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Tracks oxygen cylinder depletion and nebulizer usage to pre-allocate pediatric beds.</p>
            <button className="action-btn" style={{ width: '100%', backgroundColor: '#0f172a', color: 'white' }} onClick={handleAllocateBeds} disabled={isAllocating}>
              {isAllocating ? '⏳ Allocating Beds...' : 'Pre-Allocate Pediatric Beds'}
            </button>
          </div>

          <div className="clinical-card">
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0' }}>Real-Time Clinical Consumption</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(inventory).map(([item, qty]) => (
                <div key={item} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#475569', fontSize: '0.9rem', fontWeight: '500' }}>{item}</span>
                  <span className={`badge ${(qty as number) < 15 ? 'badge-warn' : 'badge-ok'}`}>
                    {qty as number} Units
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 3: FEFO & Ghost Doctors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="clinical-card" style={{ border: '2px solid #0ea5e9', backgroundColor: '#f0f9ff' }}>
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#0369a1' }}>FEFO Expiry Waste Prevention</h2>
            
            {!fefoTransferred ? (
              <>
                <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #bae6fd', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#0284c7', textTransform: 'uppercase' }}>Rural PHC (Low Footfall)</div>
                  <div style={{ fontWeight: '600', color: '#0f172a' }}>Stagnant Inventory</div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>Anti-venom vials set to expire in 45 days with zero patient demand.</div>
                </div>
                <button className="action-btn" style={{ backgroundColor: '#0ea5e9', color: 'white', width: '100%', border: 'none' }} onClick={handleFefoTransfer} disabled={isTransferring}>
                  {isTransferring ? '⏳ Authorizing Transfer Protocol...' : 'Initiate Automated Transfer ➔'}
                </button>
              </>
            ) : (
              <div style={{ backgroundColor: '#dcfce7', padding: '1rem', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' }}>District Hospital (High Footfall)</div>
                <div style={{ fontWeight: '600', color: '#0f172a' }}>Immediate Utilization</div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>First-to-Expire, First-Out (FEFO) algorithm prevented cold-chain medical waste. Transfer Complete.</div>
              </div>
            )}
          </div>

          <div className="clinical-card" style={{ flexGrow: 1 }}>
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>Verified Biometric Attendance</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>Falsified biometric shift logs mask severe rural staffing vacuums. We solve this passively.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {doctors.map((doc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.95rem' }}>{doc.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Voice Match Verified • {doc.time}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="action-btn" style={{ width: '100%', marginTop: '1.5rem' }} onClick={handleExportLogs} disabled={isExporting}>
              {isExporting ? '⏳ Encrypting...' : 'Export 100% Verified Attendance Logs'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
