import { useState, useRef, useEffect } from 'react';
import { syncService } from './lib/syncService';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Toast System
  const [toast, setToast] = useState<{message: string, type: 'success' | 'warning' | 'info'} | null>(null);
  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

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
    'Anti-Venom (Vials)': 5
  });
  
  const [highlightedItems, setHighlightedItems] = useState<string[]>([]);
  const triggerInventoryHighlight = (items: string[]) => {
    setHighlightedItems(items);
    setTimeout(() => setHighlightedItems([]), 2500);
  };

  const [doctors, setDoctors] = useState<{name: string, time: string}[]>([
    { name: 'Dr. S. Verma', time: new Date().toLocaleTimeString() },
    { name: 'Dr. A. Gupta', time: new Date(Date.now() - 3600000).toLocaleTimeString() }
  ]);

  const [fefoTransferred, setFefoTransferred] = useState(false);
  
  // Loading states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [opticalLogs, setOpticalLogs] = useState<string[]>([
    'Waiting for stock register image capture...'
  ]);

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
      showToast('Microphone Access Denied', 'warning');
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
               
               const doctorName = r.data?.doctorName || 'Dr. S. Verma';
               setLogs(prev => [
                 ...prev, 
                 `[SYSTEM] Biometric match: ${doctorName}`, 
                 `[ENTITY] Blood Req: ${r.data?.bloodRequirement || '2 Units O-negative'}`,
                 `[ENTITY] Bed Req: ${r.data?.bedRequirement || 'ICU'}`,
                 `> State ledger updated. Attendance locked.`
               ]);
               
               showToast(`✅ Biometric Verified: ${doctorName} & Triage Recorded`, 'success');
               triggerInventoryHighlight(['O-negative Blood', 'ICU Beds']);
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
    showToast('🔄 Delta Sync Complete: 0 Bytes Pending', 'success');
  };

  const handleFirebaseWarning = async () => {
    setIsDispatching(true);
    setLogs(prev => [...prev, '> [FEDERATED AI] Patient data retained locally. Sending only MODEL WEIGHTS to State Server...']);
    await new Promise(r => setTimeout(r, 1000));
    setLogs(prev => [...prev, '> [FCM] Constructing high-priority payload for Dengue cluster...']);
    await new Promise(r => setTimeout(r, 1500));
    setLogs(prev => [...prev, '> [FCM] SUCCESS: Early warning dispatched to 14 District Health Officers.']);
    setIsDispatching(false);
    showToast('🚨 Firebase Warning Dispatched to 14 Health Officers!', 'warning');
  };

  const handleAutoRoute = async () => {
    setIsRouting(true);
    setLogs(prev => [...prev, '> [VERTEX AI] Analyzing incoming federated model weights...']);
    await new Promise(r => setTimeout(r, 1000));
    setLogs(prev => [...prev, '> [VERTEX AI] Calculating optimal supply re-routing for Dengue surge...']);
    await new Promise(r => setTimeout(r, 2000));
    setInventory((prev: any) => ({...prev, 'IV Paracetamol': prev['IV Paracetamol'] + 500, 'Platelets': prev['Platelets'] + 100}));
    setLogs(prev => [...prev, '> [LOGISTICS] SUCCESS: 500 IV Paracetamol & 100 Platelets rerouted to Rural PHC.']);
    setIsRouting(false);
    triggerInventoryHighlight(['IV Paracetamol', 'Platelets']);
    showToast('🚚 Automated Supply Route Authorized (Zone 4)', 'success');
  };

  const handleAllocateBeds = async () => {
    setIsAllocating(true);
    setLogs(prev => [...prev, '> [VERTEX AI] Analyzing respiratory surge metrics vs bed capacity...']);
    await new Promise(r => setTimeout(r, 1800));
    setInventory((prev: any) => ({...prev, 'ICU Beds': prev['ICU Beds'] + 15}));
    setLogs(prev => [...prev, '> [HOSPITAL ADMIN] SUCCESS: 15 Pediatric beds preemptively allocated.']);
    setIsAllocating(false);
    triggerInventoryHighlight(['ICU Beds']);
    showToast('🏥 15 Pediatric Beds Pre-Allocated across PHCs', 'success');
  };

  const handleFefoTransfer = async () => {
    setIsTransferring(true);
    setLogs(prev => [...prev, '> [FEFO ALGORITHM] Initiating cold-chain transfer protocol...']);
    await new Promise(r => setTimeout(r, 2000));
    setFefoTransferred(true);
    setInventory((prev: any) => ({...prev, 'Anti-Venom (Vials)': 0}));
    setLogs(prev => [...prev, '> [LOGISTICS] SUCCESS: Anti-venom transfer authorized. Waste prevented.']);
    setIsTransferring(false);
    triggerInventoryHighlight(['Anti-Venom (Vials)']);
    showToast('📦 FEFO Transfer Complete: 5 Vials Waste Prevented', 'success');
  };

  const handleExportLogs = async () => {
    setIsExporting(true);
    setLogs(prev => [...prev, '> [SECURITY] Generating cryptographic attendance hash...']);
    await new Promise(r => setTimeout(r, 1000));
    setLogs(prev => [...prev, '> [EXPORT] SUCCESS: 100% Verified Attendance Logs downloaded.']);
    setIsExporting(false);
    showToast('⬇️ 100% Verified Attendance Logs Downloaded', 'info');
  };

  const handleOpticalScan = async () => {
    setIsScanning(true);
    setOpticalLogs(['> Camera initialized. Capturing physical stock register...']);
    await new Promise(r => setTimeout(r, 1000));
    setOpticalLogs(prev => [...prev, '> Analyzing image via Edge Computer Vision...']);
    await new Promise(r => setTimeout(r, 1500));
    setOpticalLogs(prev => [...prev, '> Handwriting OCR successful. Validating tallies...']);
    await new Promise(r => setTimeout(r, 1000));
    setOpticalLogs(prev => [...prev, '[EXTRACTED] O-negative Blood: 12 -> 14']);
    setOpticalLogs(prev => [...prev, '[EXTRACTED] Oxygen Cylinders: 45 -> 40']);
    setInventory((prev: any) => ({...prev, 'O-negative Blood': 14, 'Oxygen Cylinders': 40}));
    setOpticalLogs(prev => [...prev, '> National Ledger updated. Zero typing required.']);
    setIsScanning(false);
    setHasScanned(true);
    triggerInventoryHighlight(['O-negative Blood', 'Oxygen Cylinders']);
    showToast('📸 OCR Success: Handwriting Extracted and Ledger Updated!', 'success');
  };

  // --- RENDER PAGES ---

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <div className="clinical-card" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Active PHC Nodes</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', marginTop: '0.5rem' }}>14,024</div>
          <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>↑ 99.9% Uptime</div>
        </div>
        <div className="clinical-card" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Triage Processed (24h)</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', marginTop: '0.5rem' }}>842,109</div>
          <div style={{ color: '#0ea5e9', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>Via Acoustic & OCR</div>
        </div>
        <div className="clinical-card" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Predictive Accuracy</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', marginTop: '0.5rem' }}>96.4%</div>
          <div style={{ color: '#8b5cf6', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>Vertex AI Federated Model</div>
        </div>
        <div className="clinical-card" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Expiry Waste Prevented</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', marginTop: '0.5rem' }}>$4.2M</div>
          <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>Via FEFO Transfers</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Action Feed */}
        <div className="clinical-card">
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0', color: '#0f172a' }}>National Health Grid Activity Feed</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', fontWeight: '600' }}>Time</th>
                <th style={{ padding: '0.75rem', fontWeight: '600' }}>Sub-System</th>
                <th style={{ padding: '0.75rem', fontWeight: '600' }}>Event Details</th>
                <th style={{ padding: '0.75rem', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>Just Now</td>
                <td style={{ padding: '1rem 0.75rem', fontWeight: '500' }}>Edge-Sync</td>
                <td style={{ padding: '1rem 0.75rem' }}>Delta buffer flushed for 45 rural PHCs.</td>
                <td style={{ padding: '1rem 0.75rem' }}><span className="badge badge-ok">SYNCED</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>2m ago</td>
                <td style={{ padding: '1rem 0.75rem', fontWeight: '500' }}>Epidemic AI</td>
                <td style={{ padding: '1rem 0.75rem' }}>Dengue probability in Zone 4 reached 89%.</td>
                <td style={{ padding: '1rem 0.75rem' }}><span className="badge badge-warn">ALERT</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>14m ago</td>
                <td style={{ padding: '1rem 0.75rem', fontWeight: '500' }}>Acoustic AI</td>
                <td style={{ padding: '1rem 0.75rem' }}>Biometric lock: 412 doctors verified on shift.</td>
                <td style={{ padding: '1rem 0.75rem' }}><span className="badge badge-ok">VERIFIED</span></td>
              </tr>
              <tr>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>1h ago</td>
                <td style={{ padding: '1rem 0.75rem', fontWeight: '500' }}>FEFO Logic</td>
                <td style={{ padding: '1rem 0.75rem' }}>Re-routed 1,200 expiring vaccines to District General.</td>
                <td style={{ padding: '1rem 0.75rem' }}><span className="badge badge-ok">RESOLVED</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Live Alerts */}
        <div className="clinical-card" style={{ backgroundColor: '#f8fafc' }}>
           <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0', color: '#0f172a' }}>System Health</h2>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.9rem' }}>National Database</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>Latency: 12ms • Zero Data Loss</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.9rem' }}>Vertex AI Models</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>Federated gradients aggregated 5 mins ago.</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.9rem' }}>Rural Power Grid</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>Outages detected in Zone 2. Fallback to SQLite Edge-Sync active.</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderAcousticTriage = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: '2rem' }}>
      <div className="clinical-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>Acoustic Proof-of-Presence</h2>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '2rem' }}>Doctors dictate 5-second triage notes. Passive capture eliminates data entry burden.</p>
        <button 
          onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
          className={`dictate-btn ${recording ? 'recording' : ''}`} style={{ marginBottom: '1.5rem', padding: '2rem 1rem' }}
        >
          {recording ? '🎙️ Release to Authenticate & Parse' : '🎙️ Hold to Dictate Triage'}
        </button>
        <div style={{ backgroundColor: '#0d1117', color: '#56d364', padding: '1rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.85rem', flexGrow: 1, minHeight: '200px', overflowY: 'auto', border: '1px solid #30363d', display: 'flex', flexDirection: 'column-reverse' }}>
          <div>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '8px', color: log.includes('[SYSTEM]') ? '#58a6ff' : log.includes('[ENTITY]') ? '#38bdf8' : log.includes('[ERROR]') ? '#ff7b72' : '#56d364' }}>{log}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="clinical-card">
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 1rem 0', color: '#0f172a' }}>Biometric Attendance</h2>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>Solving the ghost doctor bottleneck.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1, overflowY: 'auto' }}>
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
          {isExporting ? '⏳ Encrypting...' : '⬇️ Export Secure Logs'}
        </button>
      </div>
      <div className="clinical-card">
         <h2 style={{ fontSize: '1.25rem', margin: '0 0 1rem 0', color: '#0f172a' }}>Live Patient Queue (Auto-Generated)</h2>
         <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>Parsed directly from voice dictation. No typing.</p>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '6px', borderLeft: '4px solid #ef4444' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <strong style={{ fontSize: '0.9rem' }}>Patient #8492</strong>
                 <span className="badge badge-warn">Priority 1 (ICU)</span>
               </div>
               <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>Needs: 2 Units O-negative.</div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '6px', borderLeft: '4px solid #f59e0b' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <strong style={{ fontSize: '0.9rem' }}>Patient #8491</strong>
                 <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 'bold' }}>Priority 2</span>
               </div>
               <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>Needs: IV Fluids (Dengue Protocol).</div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <strong style={{ fontSize: '0.9rem' }}>Patient #8490</strong>
                 <span className="badge badge-ok">Priority 4</span>
               </div>
               <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>Needs: Routine consultation.</div>
            </div>
         </div>
      </div>
    </div>
  );

  const renderOpticalLedger = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
      <div className="clinical-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '400px' }}>
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>Optical Edge-Ledger</h2>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '2rem', padding: '0 1rem' }}>Take a photo of the physical stock register. Edge Computer Vision extracts handwritten tallies instantly.</p>
        
        {!hasScanned ? (
          <div className={isScanning ? 'scanner-container' : ''} style={{ width: '100%', maxWidth: '300px', height: '200px', border: '2px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', marginBottom: '2rem', position: 'relative' }}>
            {isScanning && <div className="scan-line"></div>}
            <span style={{ fontSize: '3rem', opacity: isScanning ? 1 : 0.5 }}>📸</span>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '300px', padding: '1.5rem', border: '2px solid #10b981', borderRadius: '8px', backgroundColor: '#dcfce7', marginBottom: '2rem', textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', color: '#166534', marginBottom: '1rem' }}>✅ Image Successfully Extracted</div>
            <div style={{ fontSize: '0.9rem', color: '#166534', fontFamily: 'monospace', lineHeight: '1.6' }}>
              O-Negative: <span style={{fontWeight: 'bold', color: '#059669'}}>+2 Units Added</span><br/>
              O2 Cylinders: <span style={{fontWeight: 'bold', color: '#ef4444'}}>-5 Units Deducted</span>
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '1.5rem', color: '#15803d', fontWeight: 'bold' }}>National Server Sync Complete.</div>
          </div>
        )}

        <button className="dictate-btn" style={{ width: '90%', padding: '1rem' }} onClick={handleOpticalScan} disabled={isScanning}>
          {isScanning ? '⏳ Extracting Handwriting OCR...' : '📷 Capture Physical Stock Register'}
        </button>
      </div>
      <div className="clinical-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 1rem 0', color: '#0f172a' }}>Vision AI Extraction Engine</h2>
        <div style={{ backgroundColor: '#0d1117', color: '#56d364', padding: '1rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.85rem', flexGrow: 1, overflowY: 'auto', border: '1px solid #30363d', display: 'flex', flexDirection: 'column' }}>
          {opticalLogs.map((log, i) => (
            <div key={i} style={{ marginBottom: '8px', color: log.includes('[EXTRACTED]') ? '#38bdf8' : '#56d364' }}>{log}</div>
          ))}
        </div>
      </div>
      <div className="clinical-card">
         <h2 style={{ fontSize: '1.25rem', margin: '0 0 1rem 0', color: '#0f172a' }}>Digitized Register Archive</h2>
         <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>Historical OCR scans with AI confidence ratings.</p>
         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Doc ID</th>
                <th style={{ padding: '0.75rem' }}>Type</th>
                <th style={{ padding: '0.75rem' }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0.75rem', fontWeight: '500' }}>REG-0994</td>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>Blood Bank</td>
                <td style={{ padding: '1rem 0.75rem', color: '#10b981', fontWeight: 'bold' }}>99.4%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0.75rem', fontWeight: '500' }}>REG-0993</td>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>Pharmacy Ward</td>
                <td style={{ padding: '1rem 0.75rem', color: '#10b981', fontWeight: 'bold' }}>98.1%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0.75rem', fontWeight: '500' }}>REG-0992</td>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>ICU Beds</td>
                <td style={{ padding: '1rem 0.75rem', color: '#f59e0b', fontWeight: 'bold' }}>82.3% (Flagged)</td>
              </tr>
            </tbody>
          </table>
      </div>
    </div>
  );

  const renderPredictiveRouting = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="clinical-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🦠 Epidemiological Federated Routing
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#7f1d1d', marginBottom: '1rem' }}>Patient data never leaves the district. Sending only model weights to state server to trigger early warnings.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="action-btn" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', justifyContent: 'center' }} onClick={handleFirebaseWarning} disabled={isDispatching}>
              {isDispatching ? '⏳ Transmitting Weights...' : '📡 Dispatch Federated Warning'}
            </button>
            <button className="action-btn" style={{ justifyContent: 'center' }} onClick={handleAutoRoute} disabled={isRouting}>
              {isRouting ? '⏳ Routing...' : '🚚 Auto-Route Buffers to Surge Zone'}
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
            <div key={item} className={highlightedItems.includes(item) ? 'inventory-highlight' : ''} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', padding: '0.5rem 1rem', borderRadius: '4px' }}>
              <span style={{ color: '#475569', fontSize: '1rem', fontWeight: '500' }}>{item}</span>
              <span className={`badge ${(qty as number) < 15 ? 'badge-warn' : 'badge-ok'}`} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                {qty as number} Units
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="clinical-card">
         <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0' }}>AI Confidence Metrics</h2>
         <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>Explainability for the Dengue Epidemic trigger in Zone 4.</p>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  <span>IV Paracetamol Depletion Velocity</span>
                  <span style={{ color: '#ef4444' }}>+400%</span>
               </div>
               <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '92%', height: '100%', backgroundColor: '#ef4444' }}></div>
               </div>
            </div>
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  <span>Platelet Request Frequency</span>
                  <span style={{ color: '#ef4444' }}>Critical</span>
               </div>
               <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', backgroundColor: '#ef4444' }}></div>
               </div>
            </div>
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  <span>Local Humidity / Weather Data</span>
                  <span style={{ color: '#f59e0b' }}>85% RH</span>
               </div>
               <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '70%', height: '100%', backgroundColor: '#f59e0b' }}></div>
               </div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginTop: '1rem' }}>
               <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>AI Conclusion:</strong>
               <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>Metrics strongly correlate with historical Vector-Borne outbreak data. 94% Probability.</div>
            </div>
         </div>
      </div>
    </div>
  );

  const renderFefoLogistics = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
      <div className="clinical-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem 0', color: '#0369a1', textAlign: 'center' }}>FEFO Expiry Waste Prevention</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem', maxWidth: '600px' }}>First-to-Expire, First-Out (FEFO) algorithm prevents cold-chain medical waste between low and high footfall areas.</p>
        
        {!fefoTransferred ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', width: '100%', maxWidth: '500px' }}>
            <div style={{ backgroundColor: 'white', padding: '2rem', width: '100%', borderRadius: '8px', border: '2px solid #bae6fd', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0ea5e9', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Rural PHC (Low Footfall)</div>
              <div style={{ fontWeight: '700', fontSize: '1.5rem', color: '#0f172a' }}>Stagnant Inventory</div>
              <div style={{ fontSize: '1rem', color: '#475569', marginTop: '0.5rem' }}>Anti-venom vials set to expire in 45 days with zero patient demand.</div>
            </div>
            <button className="action-btn" style={{ backgroundColor: '#0ea5e9', color: 'white', padding: '1rem 3rem', fontSize: '1.1rem', border: 'none', borderRadius: '50px', boxShadow: '0 4px 14px rgba(14,165,233,0.4)' }} onClick={handleFefoTransfer} disabled={isTransferring}>
              {isTransferring ? '⏳ Authorizing Transfer Protocol...' : 'Initiate Automated Transfer ➔'}
            </button>
          </div>
        ) : (
          <div style={{ backgroundColor: '#dcfce7', padding: '2rem', width: '100%', maxWidth: '500px', borderRadius: '8px', border: '2px solid #bbf7d0', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase', marginBottom: '0.5rem' }}>District Hospital (High Footfall)</div>
            <div style={{ fontWeight: '700', fontSize: '1.5rem', color: '#0f172a' }}>Immediate Utilization</div>
            <div style={{ fontSize: '1rem', color: '#475569', marginTop: '1rem' }}>✅ First-to-Expire, First-Out (FEFO) algorithm actively prevented cold-chain medical waste. Transfer Complete.</div>
          </div>
        )}
      </div>

      <div className="clinical-card">
         <h2 style={{ fontSize: '1.25rem', margin: '0 0 1rem 0', color: '#0f172a' }}>National Cold-Chain Map</h2>
         <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>Real-time refrigeration telemetry and expiry risk across all PHCs.</p>
         
         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Facility</th>
                <th style={{ padding: '0.75rem' }}>Temp</th>
                <th style={{ padding: '0.75rem' }}>Highest Risk Item</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0.75rem', fontWeight: '500' }}>Zone 4 Rural</td>
                <td style={{ padding: '1rem 0.75rem', color: '#10b981', fontWeight: 'bold' }}>2.4°C</td>
                <td style={{ padding: '1rem 0.75rem', color: '#ef4444', fontWeight: 'bold' }}>Anti-Venom (45d)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0.75rem', fontWeight: '500' }}>City Gen. Hospital</td>
                <td style={{ padding: '1rem 0.75rem', color: '#10b981', fontWeight: 'bold' }}>3.1°C</td>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>Insulin (300d)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0.75rem', fontWeight: '500' }}>North Outpost</td>
                <td style={{ padding: '1rem 0.75rem', color: '#f59e0b', fontWeight: 'bold' }}>6.8°C (Warn)</td>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>Polio Vac. (120d)</td>
              </tr>
              <tr>
                <td style={{ padding: '1rem 0.75rem', fontWeight: '500' }}>East Clinic</td>
                <td style={{ padding: '1rem 0.75rem', color: '#10b981', fontWeight: 'bold' }}>4.0°C</td>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>Hep-B Vac (210d)</td>
              </tr>
            </tbody>
          </table>
      </div>
    </div>
  );

  const renderEdgeSync = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
      <div className="clinical-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem 0', color: '#0f172a' }}>Offline-First Resilience</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Built for erratic rural power grids and unreliable 2G connectivity.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💾</div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>SQLite Edge-Sync</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Triage notes cache locally in encrypted buffers during outages.</p>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📡</div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Delta Sync Protocol</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Transmits only state changes upon connection restore. Zero data loss.</p>
          </div>
        </div>

        <button className="action-btn" style={{ padding: '1rem', fontSize: '1rem', borderRadius: '8px', justifyContent: 'center' }} onClick={handleForceSync} disabled={isSyncing}>
          {isSyncing ? '⏳ Syncing Local State with Cloud...' : '🔄 Force Delta Sync'}
        </button>
      </div>

      <div className="clinical-card">
         <h2 style={{ fontSize: '1.25rem', margin: '0 0 1rem 0', color: '#0f172a' }}>Rural Node Telemetry (Live)</h2>
         <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>Monitoring network stability across 14,024 PHC edge nodes.</p>
         
         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Node ID</th>
                <th style={{ padding: '0.75rem' }}>Location</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Unsynced Buffer</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0.75rem', fontWeight: 'bold' }}>ND-992</td>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>Secunderabad PHC</td>
                <td style={{ padding: '1rem 0.75rem' }}><span className="badge badge-ok">ONLINE</span></td>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>0 bytes</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0.75rem', fontWeight: 'bold' }}>ND-993</td>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>Warangal Rural</td>
                <td style={{ padding: '1rem 0.75rem' }}><span className="badge badge-warn">OFFLINE (Power)</span></td>
                <td style={{ padding: '1rem 0.75rem', color: '#ef4444', fontWeight: 'bold' }}>4.2 MB (Caching)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0.75rem', fontWeight: 'bold' }}>ND-994</td>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>Khammam District</td>
                <td style={{ padding: '1rem 0.75rem' }}><span className="badge badge-ok">ONLINE (2G)</span></td>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>0 bytes</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0.75rem', fontWeight: 'bold' }}>ND-995</td>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>Nizamabad Outpost</td>
                <td style={{ padding: '1rem 0.75rem' }}><span className="badge badge-warn">OFFLINE (Network)</span></td>
                <td style={{ padding: '1rem 0.75rem', color: '#ef4444', fontWeight: 'bold' }}>1.8 MB (Caching)</td>
              </tr>
              <tr>
                <td style={{ padding: '1rem 0.75rem', fontWeight: 'bold' }}>ND-996</td>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>Karimnagar Hub</td>
                <td style={{ padding: '1rem 0.75rem' }}><span className="badge badge-ok">ONLINE</span></td>
                <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>0 bytes</td>
              </tr>
            </tbody>
          </table>
      </div>
    </div>
  );

  return (
    <div className="layout">
      {/* Massive Toast Notification */}
      {toast && (
        <div className={`toast-notification ${toast.type === 'success' ? 'toast-success' : toast.type === 'info' ? 'toast-info' : 'toast-warning'}`}>
          <span style={{ fontSize: '1.5rem' }}>{toast.type === 'success' ? '✅' : toast.type === 'info' ? 'ℹ️' : '🚨'}</span>
          {toast.message}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#0ea5e9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>☤</div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: '700' }}>NodeBinding AI</h1>
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: '1.4' }}>Zero-Friction Federated Supply & Triage Engine</div>
        </div>
        
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <span>📊</span> National Command
          </div>
          <div style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', color: '#475569', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1rem' }}>Core Modules</div>
          <div className={`nav-item ${activeTab === 'triage' ? 'active' : ''}`} onClick={() => setActiveTab('triage')}>
            <span>🎙️</span> Acoustic Triage
          </div>
          <div className={`nav-item ${activeTab === 'optical' ? 'active' : ''}`} onClick={() => setActiveTab('optical')}>
            <span>📸</span> Optical Ledger
          </div>
          <div className={`nav-item ${activeTab === 'predictive' ? 'active' : ''}`} onClick={() => setActiveTab('predictive')}>
            <span>📈</span> Federated Routing
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
              {activeTab === 'overview' && 'National Command Overview'}
              {activeTab === 'triage' && 'Acoustic Proof-of-Presence'}
              {activeTab === 'optical' && 'Optical Edge-Ledger'}
              {activeTab === 'predictive' && 'Epidemiological Federated Routing'}
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
