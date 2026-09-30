# NodeBinding AI

**Zero-friction federated intelligence for national-scale triage, attendance verification, and predictive supply routing.**

Built for the **Build with AI: Code for Communities** Hackathon (Track: Smart Health & Supply Chain Resilience).

## System Architecture

NodeBinding AI converts passive clinical triage into an active national supply chain defense system.

### Core Pillars
1. **Acoustic Proof-of-Presence**: Voice biometrics to authenticate active clinical presence (eliminating "Ghost Doctors") and NLP extraction for triage notes (bed/blood requirements).
2. **Offline-First Resilience**: SQLite Edge-Sync to cache triage notes locally during power/network outages, syncing via Delta Sync Protocol (zero data loss) upon restoration.
3. **Predictive Supply Routing**: Epidemic triggers (e.g., Dengue vector-borne outbreaks) and FEFO (First-to-Expire, First-Out) waste prevention algorithms.

### Tech Stack
* **AI/ML Models**: Gemini 1.5 Flash (real-time multimodal transcription & OCR), Vertex Federated Pipeline.
* **Backend Services**: Google Cloud Run, BigQuery (scalable district telemetry).
* **Database & Edge**: Firebase, SQLite (Edge).
* **Frontend/Client**: TBD (React / Web PWA for offline support).

## Directory Structure
```
NodeBindingAI/
├── client/          # Frontend application (offline-first edge client)
├── server/          # Cloud Run microservices (Node.js/TypeScript)
├── ai-services/     # Vertex AI / Gemini integration pipelines
├── docs/            # Architecture & API documentation
├── tests/           # E2E and integration tests
└── AGENTS.md        # AI Harness rules
```
