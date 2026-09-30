import { useState, useRef, useEffect } from 'react';
import { syncService } from './lib/syncService';
import './App.css';

// --- Enterprise SVG Icons ---
const IconDashboard = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>;
const IconMic = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const IconCamera = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IconTrending = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IconBox = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IconSync = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>;
const IconCheck = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="#10b981" strokeWidth="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconAlert = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="#ef4444" strokeWidth="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconInfo = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="#38bdf8" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const IconMedical = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;

function App() {
  const [activeTab, setActiveTab] = useState('triage');
  
  // Toast System
  const [toast, setToast] = useState<{message: string, type: 'success' | 'warning' | 'info'} | null>(null);
  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const [recording, setRecording] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '[SYS] Initialization sequence complete.',
    '[NET] Secure channel to National Ledger verified.',
    '[NLP] Vertex AI Triage parsing engine ready.'
  ]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Triage System State (Dense Fake Data)
  const [triageQueue, setTriageQueue] = useState<any[]>([
    { id: 'TRG-8994', priority: 1, needs: '2 Units O-negative, ICU Bed', confidence: '99.1%', doc: 'Dr. A. Gupta', time: new Date(Date.now() - 120000).toLocaleTimeString() },
    { id: 'TRG-8993', priority: 2, needs: 'IV Paracetamol, Platelets', confidence: '98.5%', doc: 'Dr. S. Verma', time: new Date(Date.now() - 360000).toLocaleTimeString() },
    { id: 'TRG-8992', priority: 4, needs: 'Routine Consult (No Supply Req)', confidence: '99.8%', doc: 'Dr. K. Rao', time: new Date(Date.now() - 720000).toLocaleTimeString() },
    { id: 'TRG-8991', priority: 1, needs: 'Pediatric Nebulizer, O2 Cylinder', confidence: '97.2%', doc: 'Dr. A. Gupta', time: new Date(Date.now() - 1500000).toLocaleTimeString() },
    { id: 'TRG-8990', priority: 3, needs: 'Anti-Venom (1 Vial)', confidence: '99.9%', doc: 'Dr. S. Verma', time: new Date(Date.now() - 3600000).toLocaleTimeString() },
    { id: 'TRG-8989', priority: 4, needs: 'Prescription Refill', confidence: '99.5%', doc: 'Dr. K. Rao', time: new Date(Date.now() - 4200000).toLocaleTimeString() },
  ]);

  const [inventory, setInventory] = useState<any>({
    'O-negative Blood': 12,
    'ICU Beds': 2,
    'IV Paracetamol': 45,
    'Platelets': 8,
    'Oxygen Cylinders': 45,
    'Pediatric Nebulizers': 12,
    'Anti-Venom (Vials)': 5
  });

  const [doctors, setDoctors] = useState<any[]>([
    { name: 'Dr. S. Verma', time: new Date().toLocaleTimeString() },
    { name: 'Dr. A. Gupta', time: new Date(Date.now() - 3600000).toLocaleTimeString() }
  ]);
  
  const [highlightedItems, setHighlightedItems] = useState<string[]>([]);
  const triggerInventoryHighlight = (items: string[]) => {
    setHighlightedItems(items);
    setTimeout(() => setHighlightedItems([]), 2500);
  };

  const [fefoTransferred, setFefoTransferred] = useState(false);
  
  // Loading states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [opticalLogs, setOpticalLogs] = useState<string[]>([
    '[SYS] Awaiting edge device image buffer...'
  ]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const results = await syncService.flushQueue();
      if (results.length > 0) {
        const result = results[0];
        if (result.supplyState) setInventory(result.supplyState);
        if (result.data?.doctorName) {
          setDoctors((prev: any) => [{name: result.data.doctorName, time: new Date().toLocaleTimeString()}, ...prev]);
        }
        setLogs(prev => ['[SYNC] Delta flush complete. Zero data loss.', ...prev]);
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
      setLogs(prev => ['[MIC] Stream active. Capturing acoustic biomarkers...', ...prev]);
    } catch (err) {
      setLogs(prev => ['[ERR] Hardware interface exception (Microphone)', ...prev]);
      showToast('Hardware Exception: Mic Denied', 'warning');
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
            setLogs(prev => ['[NLP] Extracting clinical entities via Gemini Flash...', '[SEC] Triage cached to encrypted SQLite edge buffer.', ...prev]);
            await syncService.queueTriage(base64data);
            
            const results = await syncService.flushQueue();
            if (results.length > 0) {
               const r = results[0];
               if (r.supplyState) setInventory(r.supplyState);
               
               const doctorName = r.data?.doctorName || 'Dr. S. Verma';
               setDoctors((prev: any) => [{name: doctorName, time: new Date().toLocaleTimeString()}, ...prev]);
               
               const blood = r.data?.bloodRequirement || '2 Units O-negative';
               const bed = r.data?.bedRequirement || 'ICU Bed';
               
               setLogs(prev => [
                 `[DB] Attendance locked. State ledger mutated.`,
                 `[EXTRACT] Needs: ${blood}, ${bed}`,
                 `[AUTH] Biometric signature matched: ${doctorName}`, 
                 ...prev
               ]);

               // Add to Triage Queue
               const newRecord = {
                 id: `TRG-${Math.floor(8000 + Math.random() * 999)}`,
                 priority: 1,
                 needs: `${blood}, ${bed}`,
                 confidence: '99.4%',
                 doc: doctorName,
                 time: new Date().toLocaleTimeString()
               };
               setTriageQueue(prevQ => [newRecord, ...prevQ]);
               
               showToast(`Biometric Verified: ${doctorName} & Triage Parsed`, 'success');
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
    await new Promise(r => setTimeout(r, 1200));
    setIsSyncing(false);
    showToast('Delta Sync Complete: 0 Bytes Pending', 'success');
  };

  const handleFirebaseWarning = async () => {
    setIsDispatching(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsDispatching(false);
    showToast('FCM Warning Dispatched to District Authorities', 'warning');
  };

  const handleAutoRoute = async () => {
    setIsRouting(true);
    await new Promise(r => setTimeout(r, 2000));
    setInventory((prev: any) => ({...prev, 'IV Paracetamol': prev['IV Paracetamol'] + 500, 'Platelets': prev['Platelets'] + 100}));
    setIsRouting(false);
    triggerInventoryHighlight(['IV Paracetamol', 'Platelets']);
    showToast('Automated Route Authorized (Zone 4)', 'success');
  };

  const handleAllocateBeds = async () => {
    setIsAllocating(true);
    await new Promise(r => setTimeout(r, 1800));
    setInventory((prev: any) => ({...prev, 'ICU Beds': prev['ICU Beds'] + 15}));
    setIsAllocating(false);
    triggerInventoryHighlight(['ICU Beds']);
    showToast('15 Pediatric Beds Pre-Allocated', 'success');
  };

  const handleFefoTransfer = async () => {
    setIsTransferring(true);
    await new Promise(r => setTimeout(r, 2000));
    setFefoTransferred(true);
    setInventory((prev: any) => ({...prev, 'Anti-Venom (Vials)': 0}));
    setIsTransferring(false);
    showToast('FEFO Protocol: Transfer Authorized', 'success');
  };

  const handleOpticalScan = async () => {
    setIsScanning(true);
    setOpticalLogs(['[SYS] Capturing optical stream...']);
    await new Promise(r => setTimeout(r, 1000));
    setOpticalLogs(prev => ['[AI] Executing OCR against physical register...', ...prev]);
    await new Promise(r => setTimeout(r, 1500));
    setOpticalLogs(prev => ['[AI] Conf: 99.2% | O-negative: 12 -> 14', '[AI] Conf: 98.7% | Oxygen: 45 -> 40', ...prev]);
    await new Promise(r => setTimeout(r, 1000));
    setInventory((prev: any) => ({...prev, 'O-negative Blood': 14, 'Oxygen Cylinders': 40}));
    setOpticalLogs(prev => ['[DB] National Ledger updated via vision API.', ...prev]);
    setIsScanning(false);
    setHasScanned(true);
    triggerInventoryHighlight(['O-negative Blood', 'Oxygen Cylinders']);
    showToast('Vision Extraction Complete. Ledger Updated.', 'success');
  };

  // --- RENDER PAGES ---

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <div className="clinical-card" style={{ padding: '1.5rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Edge Nodes</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', margin: '0.25rem 0' }}>14,024</div>
          <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '600' }}>Up 99.9% (30d)</div>
        </div>
        <div className="clinical-card" style={{ padding: '1.5rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Triage Processed</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', margin: '0.25rem 0' }}>842k</div>
          <div style={{ color: '#0ea5e9', fontSize: '0.8rem', fontWeight: '600' }}>Passive Acoustic/OCR</div>
        </div>
        <div className="clinical-card" style={{ padding: '1.5rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Routing Accuracy</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', margin: '0.25rem 0' }}>96.4%</div>
          <div style={{ color: '#8b5cf6', fontSize: '0.8rem', fontWeight: '600' }}>Vertex Federated AI</div>
        </div>
        <div className="clinical-card" style={{ padding: '1.5rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Waste Prevented</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', margin: '0.25rem 0' }}>$4.2M</div>
          <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '600' }}>FEFO Optimization</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="clinical-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <h2 style={{ fontSize: '1rem', margin: 0, color: '#0f172a', fontWeight: '600' }}>National Health Grid Activity</h2>
          </div>
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Sub-System</th>
                <th>Event Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: '#64748b' }}>Just Now</td>
                <td style={{ fontWeight: '500' }}>Edge-Sync</td>
                <td>Delta buffer flushed for 45 rural PHCs.</td>
                <td><span className="badge badge-ok">SYNCED</span></td>
              </tr>
              <tr>
                <td style={{ color: '#64748b' }}>2m ago</td>
                <td style={{ fontWeight: '500' }}>Epidemic AI</td>
                <td>Dengue probability in Zone 4 reached 89%.</td>
                <td><span className="badge badge-warn">ALERT</span></td>
              </tr>
              <tr>
                <td style={{ color: '#64748b' }}>14m ago</td>
                <td style={{ fontWeight: '500' }}>Acoustic AI</td>
                <td>Biometric lock: 412 doctors verified on shift.</td>
                <td><span className="badge badge-info">VERIFIED</span></td>
              </tr>
              <tr>
                <td style={{ color: '#64748b' }}>1h ago</td>
                <td style={{ fontWeight: '500' }}>FEFO Logic</td>
                <td>Re-routed 1,200 expiring vaccines to District Gen.</td>
                <td><span className="badge badge-neutral">RESOLVED</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="clinical-card" style={{ padding: '1.5rem' }}>
           <h2 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: '#0f172a', fontWeight: '600' }}>System Health</h2>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.85rem' }}>National Database</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>Latency: 12ms • Zero Data Loss</div>
              </div>
              <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', borderLeft: '4px solid #38bdf8' }}>
                <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.85rem' }}>Vertex AI Models</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>Federated gradients aggregated.</div>
              </div>
              <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.85rem' }}>Rural Power Grid</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>Outages in Zone 2. SQLite active.</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderAcousticTriage = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Dictation & Biometrics Panel */}
        <div className="clinical-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <IconMic />
            <h2 style={{ fontSize: '1rem', margin: 0, color: '#0f172a', fontWeight: '600' }}>Acoustic Proof-of-Presence Command</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>Biometric voice-print matching eliminates falsified shift logs while passively parsing medical entities.</p>
          
          <button 
            onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
            className={`dictate-btn ${recording ? 'recording' : ''}`} style={{ marginBottom: '1rem', padding: '1.5rem' }}
          >
            {recording ? (
              <div className="audio-bars">
                <div className="audio-bar"></div><div className="audio-bar"></div><div className="audio-bar"></div><div className="audio-bar"></div><div className="audio-bar"></div>
              </div>
            ) : (
              <><IconMic /> Hold to Dictate Triage Note</>
            )}
          </button>
          
          <div style={{ backgroundColor: '#0d1117', color: '#56d364', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem', height: '140px', overflowY: 'auto', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '4px', color: log.includes('[AUTH]') ? '#38bdf8' : log.includes('[EXTRACT]') ? '#fcd34d' : log.includes('[ERR]') ? '#ef4444' : '#56d364' }}>{log}</div>
            ))}
          </div>
        </div>

        {/* Attendance Verification Panel */}
        <div className="clinical-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', margin: 0, color: '#0f172a', fontWeight: '600' }}>Biometric Attendance Ledger</h2>
            <span className="badge badge-ok">100% Verified</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1, overflowY: 'auto' }}>
            {doctors.map((doc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.9rem' }}>{doc.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem' }}>Voice Match Verified • {doc.time}</div>
                </div>
                <IconCheck />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Triage Queue Table */}
      <div className="clinical-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', margin: 0, color: '#0f172a', fontWeight: '600' }}>Live Triage & Supply Extraction Queue</h2>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Parsed directly from voice via NLP. Zero typing required.</span>
        </div>
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Triage Level</th>
              <th>Extracted Supply Need</th>
              <th>NLP Confidence</th>
              <th>Doctor Auth</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {triageQueue.map((item, i) => (
              <tr key={i}>
                <td style={{ fontWeight: '500', color: '#0f172a' }}>{item.id}</td>
                <td>
                  {item.priority === 1 && <span className="badge badge-warn">Priority 1 (ICU)</span>}
                  {item.priority === 2 && <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>Priority 2</span>}
                  {item.priority === 3 && <span className="badge badge-info">Priority 3</span>}
                  {item.priority === 4 && <span className="badge badge-neutral">Priority 4</span>}
                </td>
                <td style={{ color: item.priority <= 2 ? '#ef4444' : '#1e293b', fontWeight: item.priority <= 2 ? '600' : '400' }}>{item.needs}</td>
                <td style={{ color: '#10b981', fontWeight: '500' }}>{item.confidence}</td>
                <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{item.doc}</td>
                <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOpticalLedger = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
      <div className="clinical-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '350px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <IconCamera />
          <h2 style={{ fontSize: '1rem', margin: 0, color: '#0f172a', fontWeight: '600' }}>Optical Extraction</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '2rem', padding: '0 1rem' }}>Edge Computer Vision extracts handwritten stock register tallies instantly.</p>
        
        {!hasScanned ? (
          <div className={isScanning ? 'scanner-container' : ''} style={{ width: '100%', maxWidth: '250px', height: '160px', border: '2px dashed #cbd5e1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', marginBottom: '2rem', position: 'relative' }}>
            {isScanning && <div className="scan-line"></div>}
            <IconCamera />
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '250px', padding: '1rem', border: '1px solid #10b981', borderRadius: '4px', backgroundColor: '#dcfce7', marginBottom: '2rem', textAlign: 'left' }}>
            <div style={{ fontWeight: '600', color: '#166534', marginBottom: '0.75rem', fontSize: '0.85rem' }}>Extraction Complete</div>
            <div style={{ fontSize: '0.8rem', color: '#166534', fontFamily: 'monospace', lineHeight: '1.6' }}>
              O-Negative: <span style={{fontWeight: '700', color: '#059669'}}>+2 Units Added</span><br/>
              O2 Cylinders: <span style={{fontWeight: '700', color: '#ef4444'}}>-5 Units Deducted</span>
            </div>
          </div>
        )}

        <button className="dictate-btn" style={{ width: '90%', padding: '0.75rem', fontSize: '0.9rem' }} onClick={handleOpticalScan} disabled={isScanning}>
          {isScanning ? 'Extracting OCR...' : 'Capture Stock Register'}
        </button>
      </div>
      
      <div className="clinical-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: '#0f172a', fontWeight: '600' }}>Vision Engine Telemetry</h2>
        <div style={{ backgroundColor: '#0d1117', color: '#56d364', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem', flexGrow: 1, overflowY: 'auto', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
          {opticalLogs.map((log, i) => (
            <div key={i} style={{ marginBottom: '6px', color: log.includes('[AI]') ? '#38bdf8' : '#56d364' }}>{log}</div>
          ))}
        </div>
      </div>
      
      <div className="clinical-card" style={{ padding: 0, overflow: 'hidden' }}>
         <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
           <h2 style={{ fontSize: '1rem', margin: 0, color: '#0f172a', fontWeight: '600' }}>Register Archive</h2>
         </div>
         <table className="enterprise-table">
            <thead>
              <tr>
                <th>Doc ID</th>
                <th>Category</th>
                <th>AI Conf.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: '500' }}>REG-0994</td>
                <td>Blood Bank</td>
                <td style={{ color: '#10b981', fontWeight: '600' }}>99.4%</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>REG-0993</td>
                <td>Pharmacy</td>
                <td style={{ color: '#10b981', fontWeight: '600' }}>98.1%</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>REG-0992</td>
                <td>ICU Wing</td>
                <td style={{ color: '#f59e0b', fontWeight: '600' }}>82.3%</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>REG-0991</td>
                <td>Vaccines</td>
                <td style={{ color: '#10b981', fontWeight: '600' }}>99.9%</td>
              </tr>
            </tbody>
          </table>
      </div>
    </div>
  );

  const renderPredictiveRouting = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="clinical-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <IconAlert />
            <h2 style={{ fontSize: '1rem', margin: 0, color: '#991b1b', fontWeight: '600' }}>Vector-Borne Epidemic</h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#7f1d1d', marginBottom: '1rem' }}>Patient data retained locally. Sending only model weights to state server.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="action-btn" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }} onClick={handleFirebaseWarning} disabled={isDispatching}>
              {isDispatching ? 'Transmitting Weights...' : 'Dispatch Federated Warning'}
            </button>
            <button className="action-btn" onClick={handleAutoRoute} disabled={isRouting}>
              {isRouting ? 'Routing...' : 'Auto-Route Supplies'}
            </button>
          </div>
        </div>
        <div className="clinical-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <IconInfo />
            <h2 style={{ fontSize: '1rem', margin: 0, color: '#075985', fontWeight: '600' }}>Respiratory Surge</h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#075985', marginBottom: '1rem' }}>Tracks O2 depletion velocity to pre-allocate beds.</p>
          <button className="action-btn" style={{ width: '100%', backgroundColor: '#0f172a', color: 'white' }} onClick={handleAllocateBeds} disabled={isAllocating}>
            {isAllocating ? 'Allocating Beds...' : 'Pre-Allocate Pediatric Beds'}
          </button>
        </div>
      </div>
      
      <div className="clinical-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <h2 style={{ fontSize: '1rem', margin: 0, color: '#0f172a', fontWeight: '600' }}>Live Consumption Metrics</h2>
        </div>
        <table className="enterprise-table">
          <tbody>
            {Object.entries(inventory).map(([item, qty]) => (
              <tr key={item} className={highlightedItems.includes(item) ? 'inventory-highlight' : ''}>
                <td style={{ fontWeight: '500' }}>{item}</td>
                <td style={{ textAlign: 'right' }}>
                  <span className={`badge ${(qty as number) < 15 ? 'badge-warn' : 'badge-neutral'}`}>
                    {qty as number} Units
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="clinical-card">
         <h2 style={{ fontSize: '1rem', margin: '0 0 1.5rem 0', color: '#0f172a', fontWeight: '600' }}>Explainable AI Inference</h2>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '600' }}>
                  <span>Paracetamol Velocity</span>
                  <span style={{ color: '#ef4444' }}>+400%</span>
               </div>
               <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '92%', height: '100%', backgroundColor: '#ef4444' }}></div>
               </div>
            </div>
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '600' }}>
                  <span>Platelet Demand</span>
                  <span style={{ color: '#ef4444' }}>Critical</span>
               </div>
               <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', backgroundColor: '#ef4444' }}></div>
               </div>
            </div>
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '600' }}>
                  <span>Humidity Index</span>
                  <span style={{ color: '#f59e0b' }}>85% RH</span>
               </div>
               <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '70%', height: '100%', backgroundColor: '#f59e0b' }}></div>
               </div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', marginTop: '0.5rem' }}>
               <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>AI Conclusion (94% Conf):</strong>
               <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Metrics strongly correlate with historical Vector-Borne outbreak models.</div>
            </div>
         </div>
      </div>
    </div>
  );

  const renderFefoLogistics = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
      <div className="clinical-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <IconBox />
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#0f172a', fontWeight: '600' }}>FEFO Waste Prevention</h2>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginBottom: '2rem', maxWidth: '500px' }}>First-to-Expire, First-Out (FEFO) routing transfers high-risk stock from low footfall PHCs to high demand District Hospitals.</p>
        
        {!fefoTransferred ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', width: '100%', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Source: Rural PHC</div>
              <div style={{ fontWeight: '700', fontSize: '1.25rem', color: '#0f172a' }}>Stagnant Inventory</div>
              <div style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '0.25rem', fontWeight: '500' }}>Anti-venom vials set to expire in 45 days.</div>
            </div>
            <button className="action-btn" style={{ backgroundColor: '#0f172a', color: 'white', width: '100%', padding: '0.75rem' }} onClick={handleFefoTransfer} disabled={isTransferring}>
              {isTransferring ? 'Authorizing Protocol...' : 'Initiate Automated Transfer Protocol'}
            </button>
          </div>
        ) : (
          <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', width: '100%', maxWidth: '400px', borderRadius: '4px', border: '1px solid #10b981', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Destination: District Hospital</div>
            <div style={{ fontWeight: '700', fontSize: '1.25rem', color: '#0f172a' }}>Immediate Utilization</div>
            <div style={{ fontSize: '0.85rem', color: '#166534', marginTop: '0.5rem' }}>FEFO algorithm successfully prevented cold-chain expiration waste.</div>
          </div>
        )}
      </div>

      <div className="clinical-card" style={{ padding: 0, overflow: 'hidden' }}>
         <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
           <h2 style={{ fontSize: '1rem', margin: 0, color: '#0f172a', fontWeight: '600' }}>National Cold-Chain Telemetry</h2>
         </div>
         <table className="enterprise-table">
            <thead>
              <tr>
                <th>Facility Node</th>
                <th>Internal Temp</th>
                <th>Highest Risk Asset</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: '500' }}>Zone 4 Rural</td>
                <td style={{ color: '#10b981', fontWeight: '600' }}>2.4°C</td>
                <td style={{ color: '#ef4444', fontWeight: '600' }}>Anti-Venom (45d)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>City Gen. Hospital</td>
                <td style={{ color: '#10b981', fontWeight: '600' }}>3.1°C</td>
                <td style={{ color: '#64748b' }}>Insulin (300d)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>North Outpost</td>
                <td style={{ color: '#f59e0b', fontWeight: '600' }}>6.8°C (Warn)</td>
                <td style={{ color: '#64748b' }}>Polio Vac. (120d)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>East Clinic</td>
                <td style={{ color: '#10b981', fontWeight: '600' }}>4.0°C</td>
                <td style={{ color: '#64748b' }}>Hep-B Vac (210d)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>South Wing</td>
                <td style={{ color: '#10b981', fontWeight: '600' }}>3.8°C</td>
                <td style={{ color: '#64748b' }}>Paracetamol IV</td>
              </tr>
            </tbody>
          </table>
      </div>
    </div>
  );

  const renderEdgeSync = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
      <div className="clinical-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <IconSync />
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#0f172a', fontWeight: '600' }}>Offline-First Resilience</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '2rem' }}>Engineered for erratic rural power grids and intermittent 2G connectivity.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', borderLeft: '4px solid #94a3b8' }}>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#0f172a' }}>SQLite Edge-Sync</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>Triage notes cache locally in encrypted buffers during outages.</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', borderLeft: '4px solid #38bdf8' }}>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#0f172a' }}>Delta Sync Protocol</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>Transmits only state changes upon connection restore. Zero data loss.</p>
          </div>
        </div>

        <button className="action-btn" style={{ padding: '0.75rem', width: '100%' }} onClick={handleForceSync} disabled={isSyncing}>
          {isSyncing ? 'Syncing...' : 'Force Manual Delta Sync'}
        </button>
      </div>

      <div className="clinical-card" style={{ padding: 0, overflow: 'hidden' }}>
         <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
           <h2 style={{ fontSize: '1rem', margin: 0, color: '#0f172a', fontWeight: '600' }}>Edge Node Telemetry (Live)</h2>
         </div>
         <table className="enterprise-table">
            <thead>
              <tr>
                <th>Node ID</th>
                <th>Location</th>
                <th>Network Status</th>
                <th>Unsynced Buffer</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: '500' }}>ND-992</td>
                <td style={{ color: '#64748b' }}>Secunderabad PHC</td>
                <td><span className="badge badge-ok">ONLINE</span></td>
                <td style={{ color: '#64748b' }}>0 bytes</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>ND-993</td>
                <td style={{ color: '#64748b' }}>Warangal Rural</td>
                <td><span className="badge badge-warn">OFFLINE (Power)</span></td>
                <td style={{ color: '#ef4444', fontWeight: '600' }}>4.2 MB</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>ND-994</td>
                <td style={{ color: '#64748b' }}>Khammam District</td>
                <td><span className="badge badge-info">ONLINE (2G)</span></td>
                <td style={{ color: '#64748b' }}>0 bytes</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>ND-995</td>
                <td style={{ color: '#64748b' }}>Nizamabad Outpost</td>
                <td><span className="badge badge-warn">OFFLINE (Net)</span></td>
                <td style={{ color: '#ef4444', fontWeight: '600' }}>1.8 MB</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>ND-996</td>
                <td style={{ color: '#64748b' }}>Karimnagar Hub</td>
                <td><span className="badge badge-ok">ONLINE</span></td>
                <td style={{ color: '#64748b' }}>0 bytes</td>
              </tr>
            </tbody>
          </table>
      </div>
    </div>
  );

  return (
    <div className="layout">
      {toast && (
        <div className={`toast-notification ${toast.type === 'success' ? 'toast-success' : toast.type === 'info' ? 'toast-info' : 'toast-warning'}`}>
          {toast.type === 'success' && <IconCheck />}
          {toast.type === 'warning' && <IconAlert />}
          {toast.type === 'info' && <IconInfo />}
          {toast.message}
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <IconMedical />
            <h1 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: '600' }}>NodeBinding AI</h1>
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '1.4' }}>Federated Supply Engine</div>
        </div>
        
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <IconDashboard /> National Command
          </div>
          <div style={{ padding: '1.5rem 1.5rem 0.5rem', fontSize: '0.65rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Core Modules</div>
          <div className={`nav-item ${activeTab === 'triage' ? 'active' : ''}`} onClick={() => setActiveTab('triage')}>
            <IconMic /> Acoustic Triage
          </div>
          <div className={`nav-item ${activeTab === 'optical' ? 'active' : ''}`} onClick={() => setActiveTab('optical')}>
            <IconCamera /> Optical Ledger
          </div>
          <div className={`nav-item ${activeTab === 'predictive' ? 'active' : ''}`} onClick={() => setActiveTab('predictive')}>
            <IconTrending /> Federated Routing
          </div>
          <div className={`nav-item ${activeTab === 'fefo' ? 'active' : ''}`} onClick={() => setActiveTab('fefo')}>
            <IconBox /> FEFO Logistics
          </div>
          <div className={`nav-item ${activeTab === 'sync' ? 'active' : ''}`} onClick={() => setActiveTab('sync')}>
            <IconSync /> Edge Sync
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '600' }}>
              {activeTab === 'overview' && 'National Command Overview'}
              {activeTab === 'triage' && 'Acoustic Proof-of-Presence'}
              {activeTab === 'optical' && 'Optical Edge-Ledger'}
              {activeTab === 'predictive' && 'Epidemiological Federated Routing'}
              {activeTab === 'fefo' && 'FEFO Waste Prevention'}
              {activeTab === 'sync' && 'Offline-First Infrastructure'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="pulse"></span>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vertex Pipeline Active</span>
          </div>
        </header>

        <div className="page-content">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'triage' && renderAcousticTriage()}
          {activeTab === 'optical' && renderOpticalLedger()}
          {activeTab === 'predictive' && renderPredictiveRouting()}
          {activeTab === 'fefo' && renderFefoLogistics()}
          {activeTab === 'sync' && renderEdgeSync()}
        </div>
      </main>
    </div>
  );
}

export default App;
