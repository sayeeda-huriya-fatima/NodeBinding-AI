import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'NodeBinding AI API' });
});

import { processTriageAudio } from './ai';
import { processSupplyUpdate } from './supplyChain';

app.post('/api/triage', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    const triageData = await processTriageAudio(audioBase64, mimeType);
    
    // Convert AI extracted entities to standardized supply requests
    // (In reality, AI output should be strongly typed or mapped)
    const requirements = [];
    if (triageData.bloodRequirement) {
        requirements.push({ item: 'O-negative', qty: 2 }); // Mock qty parsing
    }
    if (triageData.bedRequirement) {
        requirements.push({ item: 'ICU Beds', qty: 1 });
    }
    
    // Let's add mock triggers for Dengue if mentioned in transcript
    if (triageData.rawTranscript?.toLowerCase().includes('dengue') || triageData.rawTranscript?.toLowerCase().includes('fever')) {
        requirements.push({ item: 'IV Paracetamol', qty: 5 });
        requirements.push({ item: 'Platelets', qty: 2 });
    }

    const { updatedInventory, alerts } = processSupplyUpdate(requirements);

    res.json({ success: true, data: triageData, supplyState: updatedInventory, alerts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process triage audio' });
  }
});

// Start the server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
