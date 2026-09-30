import { useState, useRef, useEffect } from 'react';
import { syncService } from './lib/syncService';
import './App.css';

function App() {
  const [recording, setRecording] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Attempt background sync occasionally
    const interval = setInterval(async () => {
      const results = await syncService.flushQueue();
      if (results.length > 0) {
        const newAlerts = results.flatMap((r: any) => r.alerts || []);
        if (newAlerts.length > 0) setAlerts(prev => [...prev, ...newAlerts]);
        setLogs(prev => [...prev, 'Delta Sync completed for pending items.']);
      }
    }, 5000);
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
      setLogs(prev => [...prev, 'Microphone active. Listening...']);
    } catch (err) {
      console.error(err);
      setLogs(prev => [...prev, 'Microphone access denied.']);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result?.toString().split(',')[1];
          if (base64data) {
            setLogs(prev => [...prev, 'Acoustic proof-of-presence captured. Queueing...']);
            await syncService.queueTriage(base64data);
            
            // Try an immediate flush
            const results = await syncService.flushQueue();
            if (results.length > 0) {
               const newAlerts = results.flatMap((r: any) => r.alerts || []);
               if (newAlerts.length > 0) setAlerts(prev => [...prev, ...newAlerts]);
               setLogs(prev => [...prev, `AI Extraction complete: ${JSON.stringify(results[0].data)}`]);
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
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>NodeBinding AI</h1>
      <p>Zero-friction federated intelligence for national-scale triage.</p>
      
      <div style={{ margin: '2rem 0' }}>
        <button 
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          style={{
            padding: '2rem',
            fontSize: '1.2rem',
            backgroundColor: recording ? '#ff4444' : '#00C851',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '150px',
            height: '150px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {recording ? 'Release to Send' : 'Hold to Dictate'}
        </button>
      </div>

      {alerts.length > 0 && (
        <div style={{ backgroundColor: '#4a151b', padding: '1rem', border: '1px solid #732a32', borderRadius: '4px', marginBottom: '1rem' }}>
          <h3 style={{ color: '#ff7b72', margin: '0 0 0.5rem 0' }}>Active Epidemic Triggers</h3>
          <ul style={{ color: '#ffa657', margin: 0, textAlign: 'left' }}>
            {alerts.map((alert, i) => <li key={i}>{alert}</li>)}
          </ul>
        </div>
      )}

      <div style={{ backgroundColor: '#161b22', padding: '1.5rem', border: '1px solid #30363d', borderRadius: '8px', textAlign: 'left' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#8b949e', borderBottom: '1px solid #30363d', paddingBottom: '0.5rem' }}>System Ledger & SQLite Edge-Sync Logs</h3>
        <div style={{ fontSize: '0.9rem', color: '#56d364', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {logs.map((log, i) => <div key={i}>{'>'} {log}</div>)}
          {logs.length === 0 && 'Awaiting triage input...'}
        </div>
      </div>
    </div>
  );
}

export default App;
