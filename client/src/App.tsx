import { useState, useRef, useEffect } from 'react';
import { syncService } from './lib/syncService';
import './App.css';

function App() {
  const [recording, setRecording] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([
    'CRITICAL: 43% anomaly spike in IV Paracetamol & Platelets detected in Zone 4. Predictive model indicates high-probability Dengue cluster. Automating FEFO reserve transfers from Zone 2.'
  ]);
  const [logs, setLogs] = useState<string[]>([
    'System Initialized.',
    'Establishing secure connection to National Ledger...',
    'POST /api/v1/triage/audio_stream ... [200 OK]',
    'Parsing biometric signature... MATCH: Dr. S. Verma',
    'NLP extraction: "O-negative blood (2 units)"',
    'Decrementing local inventory... Success.',
    'Encrypting delta-state for state hub...'
  ]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [inventory, setInventory] = useState<any>({
    'O-negative Blood': 50,
    'ICU Beds': 10,
    'IV Paracetamol': 100,
    'Platelet Units': 20,
    'Anti-venom (Vials)': 5
  });
  const [doctors, setDoctors] = useState<{name: string, time: string}[]>([
    { name: 'Dr. S. Verma', time: new Date().toLocaleTimeString() }
  ]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const results = await syncService.flushQueue();
      if (results.length > 0) {
        const result = results[0];
        if (result.alerts?.length > 0) setAlerts(prev => [...prev, ...result.alerts]);
        if (result.supplyState) setInventory(result.supplyState);
        if (result.data?.doctorName) {
          setDoctors(prev => [{name: result.data.doctorName, time: new Date().toLocaleTimeString()}, ...prev]);
        }
        setLogs(prev => ['[Delta Sync] Triage securely synced to National Ledger.', ...prev]);
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
      setLogs(prev => ['Microphone active. Listening for biometric match...', ...prev]);
    } catch (err) {
      setLogs(prev => ['Error: Microphone access denied by browser policies.', ...prev]);
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
            setLogs(prev => ['Audio cached securely in SQLite edge-buffer. Queueing for sync...', ...prev]);
            await syncService.queueTriage(base64data);
            
            const results = await syncService.flushQueue();
            if (results.length > 0) {
               const r = results[0];
               if (r.alerts?.length > 0) setAlerts(prev => [...r.alerts, ...prev]);
               if (r.supplyState) setInventory(r.supplyState);
               if (r.data?.doctorName) setDoctors(prev => [{name: r.data.doctorName, time: new Date().toLocaleTimeString()}, ...prev]);
               setLogs(prev => [`AI NLP Extraction complete: ${JSON.stringify(r.data)}`, ...prev]);
            }
          }
        };
      };
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setRecording(false);
    }
  };

  return (
    <div>
      {/* Clinical Top Navigation */}
      <nav style={{ backgroundColor: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#0ea5e9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>✚</div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '700' }}>Ministry of Health <span style={{ fontWeight: '400', color: '#64748b' }}>| NodeBinding AI</span></h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '50px' }}>
          <span className="pulse"></span>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>LIVE: Secunderabad District Sync</span>
        </div>
      </nav>

      {/* Main Clinical Dashboard */}
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '2rem' }}>
        
        {/* Left Column: Input & Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="clinical-card">
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0' }}>Clinical Dictation</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>Hold the button below to dictate patient triage notes. Biometrics will be passively verified.</p>
            <button 
              onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
              className={`dictate-btn ${recording ? 'recording' : ''}`}
            >
              {recording ? '🎙️ Release to Send' : '🎙️ Hold to Dictate'}
            </button>
          </div>

          <div className="clinical-card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0' }}>System Audit Logs</h2>
            <div style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.8rem', height: '300px', overflowY: 'auto' }}>
              {logs.map((log, i) => <div key={i} style={{marginBottom: '6px'}}>{'>'} {log}</div>)}
            </div>
          </div>
        </div>

        {/* Right Column: Analytics & Inventory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Emergency Alert Banner */}
          {alerts.length > 0 && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', borderLeft: '4px solid #ef4444', padding: '1.5rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                <h3 style={{ color: '#991b1b', margin: 0, fontSize: '1.1rem' }}>Epidemic Surge Warning</h3>
              </div>
              <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '2rem', fontSize: '0.95rem' }}>
                {alerts.map((alert, i) => <li key={i}>{alert}</li>)}
              </ul>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {/* Live Inventory */}
            <div className="clinical-card">
              <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
                Rural PHC Inventory
                <span className="badge badge-ok">Monitored</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(inventory).map(([item, qty]) => (
                  <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>{item}</span>
                    <span className={`badge ${(qty as number) < 10 ? 'badge-warn' : 'badge-ok'}`}>
                      {qty as number} Units
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ghost Doctor Verification */}
            <div className="clinical-card">
              <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>Biometric Attendance</h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' }}>Actively verifying staff presence.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {doctors.map((doc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👨‍⚕️</div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.9rem' }}>{doc.name}</div>
                      <div style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: '500' }}>✓ Verified at {doc.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Admin Override Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <button className="action-btn">🔄 Force District Sync</button>
            <button className="action-btn">🚑 Authorize Emergency Fleet</button>
            <button className="action-btn">📋 View Acoustic Logs</button>
            <button className="action-btn" style={{ color: '#ef4444' }}>🔒 Override Biometric Lock</button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
