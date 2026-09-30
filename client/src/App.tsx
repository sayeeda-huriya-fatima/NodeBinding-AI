import { useState, useRef, useEffect } from 'react';
import { syncService } from './lib/syncService';
import './App.css';

function App() {
  const [recording, setRecording] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [inventory, setInventory] = useState<any>({
    'O-negative': 50,
    'ICU Beds': 10,
    'IV Paracetamol': 100,
    'Platelets': 20,
    'Anti-venom': 5 // Mock for FEFO
  });
  const [doctors, setDoctors] = useState<{name: string, time: string}[]>([]);

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
        setLogs(prev => ['[Delta Sync] Triage synced to National Ledger', ...prev]);
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
      setLogs(prev => ['[Mic] Active. Listening for biometric match...', ...prev]);
    } catch (err) {
      setLogs(prev => ['[Error] Microphone access denied.', ...prev]);
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
            setLogs(prev => ['[Offline-First] Audio cached in SQLite. Queueing...', ...prev]);
            await syncService.queueTriage(base64data);
            
            // Immediate flush attempt
            const results = await syncService.flushQueue();
            if (results.length > 0) {
               const r = results[0];
               if (r.alerts?.length > 0) setAlerts(prev => [...r.alerts, ...prev]);
               if (r.supplyState) setInventory(r.supplyState);
               if (r.data?.doctorName) setDoctors(prev => [{name: r.data.doctorName, time: new Date().toLocaleTimeString()}, ...prev]);
               setLogs(prev => [`[Gemini 1.5] Extracted: ${JSON.stringify(r.data)}`, ...prev]);
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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ borderBottom: '1px solid #30363d', paddingBottom: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
        <h1 style={{ margin: 0, color: '#58a6ff' }}>NodeBinding AI</h1>
        <p style={{ margin: '5px 0 0 0', color: '#8b949e' }}>National Command Center: Triage, Verification & Supply Defense</p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* LEFT COLUMN: The Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ backgroundColor: '#161b22', padding: '2rem', borderRadius: '8px', border: '1px solid #30363d' }}>
            <h3 style={{ marginTop: 0, color: '#c9d1d9' }}>Acoustic Proof-of-Presence</h3>
            <p style={{ fontSize: '0.9rem', color: '#8b949e', marginBottom: '2rem' }}>Passive capture eliminates manual dashboard entry and ghost doctors.</p>
            <button 
              onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
              style={{
                padding: '2rem', fontSize: '1.2rem', backgroundColor: recording ? '#ff7b72' : '#238636',
                color: 'white', border: 'none', borderRadius: '50%', width: '160px', height: '160px', cursor: 'pointer',
                boxShadow: recording ? '0 0 20px rgba(255,123,114,0.4)' : 'none', transition: 'all 0.2s'
              }}
            >
              {recording ? 'Release to Send' : 'Hold to Dictate'}
            </button>
          </div>

          <div style={{ backgroundColor: '#161b22', padding: '1.5rem', borderRadius: '8px', border: '1px solid #30363d', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#8b949e', borderBottom: '1px solid #30363d', paddingBottom: '0.5rem' }}>SQLite Edge-Sync Logs</h3>
            <div style={{ fontSize: '0.85rem', color: '#56d364', fontFamily: 'monospace', height: '150px', overflowY: 'auto' }}>
              {logs.map((log, i) => <div key={i} style={{marginBottom: '4px'}}>{'>'} {log}</div>)}
              {logs.length === 0 && 'Awaiting triage input...'}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Dashboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'left' }}>
          
          {/* Alerts */}
          <div style={{ backgroundColor: alerts.length > 0 ? '#4a151b' : '#161b22', padding: '1.5rem', borderRadius: '8px', border: alerts.length > 0 ? '1px solid #732a32' : '1px solid #30363d' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: alerts.length > 0 ? '#ff7b72' : '#8b949e' }}>Predictive Supply Routing & Alerts</h3>
            {alerts.length === 0 ? (
              <p style={{ color: '#8b949e', margin: 0, fontSize: '0.9rem' }}>All systems nominal. No epidemic surges detected.</p>
            ) : (
              <ul style={{ color: '#ffa657', margin: 0, paddingLeft: '1.2rem' }}>
                {alerts.map((alert, i) => <li key={i} style={{marginBottom: '0.5rem'}}>{alert}</li>)}
              </ul>
            )}
          </div>

          {/* Grid for Inventory & Verification */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            <div style={{ backgroundColor: '#161b22', padding: '1.5rem', borderRadius: '8px', border: '1px solid #30363d' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#c9d1d9' }}>Live Inventory (Rural PHC)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {Object.entries(inventory).map(([item, qty]) => (
                  <div key={item} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #21262d', paddingBottom: '0.4rem' }}>
                    <span style={{ color: '#8b949e' }}>{item}</span>
                    <span style={{ fontWeight: 'bold', color: (qty as number) < 5 ? '#ff7b72' : '#c9d1d9' }}>{qty as number}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: '#161b22', padding: '1.5rem', borderRadius: '8px', border: '1px solid #30363d' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#c9d1d9' }}>Biometric Attendance</h3>
              <p style={{ fontSize: '0.8rem', color: '#8b949e', marginTop: '-0.5rem', marginBottom: '1rem' }}>Solving the "Ghost Doctors" bottleneck.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {doctors.length === 0 ? <span style={{color: '#8b949e', fontSize: '0.9rem'}}>No doctors verified today.</span> : null}
                {doctors.map((doc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#238636' }}></div>
                    <span style={{ color: '#c9d1d9', fontSize: '0.95rem' }}>{doc.name}</span>
                    <span style={{ color: '#8b949e', fontSize: '0.8rem', marginLeft: 'auto' }}>{doc.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
