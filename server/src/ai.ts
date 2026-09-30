import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Google Gen AI SDK
// Ensure GEMINI_API_KEY is set in your environment
const ai = new GoogleGenAI({});

export async function processTriageAudio(audioBase64: string, mimeType: string = 'audio/webm') {
    const prompt = `
    You are an acoustic proof-of-presence triage AI. 
    Analyze the provided audio dictation from a doctor.
    Extract the following details in JSON format:
    - doctorName: The name of the doctor if mentioned.
    - bloodRequirement: The type and quantity of blood requested.
    - bedRequirement: The type of bed or transfer requested (e.g., ICU).
    - rawTranscript: The exact transcript of the audio.
    
    Return ONLY a valid JSON object.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: audioBase64,
                        mimeType: mimeType
                    }
                }
            ],
            config: {
                responseMimeType: "application/json",
            }
        });

        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Error processing triage audio:", error);
        throw error;
    }
}
