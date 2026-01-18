# Aegis Health - EMI Implementation Guide

## Overview

This implementation provides two key pages for the EMI (Aegis Health) application:

1. **Landing Page** (`src/app/(public)/page.tsx`) - The Hospital Entry Point
2. **Scheduling/Triage Page** (`src/app/(public)/scheduling/page.tsx`) - The Adaptive Pre-Screening Bridge

## Architecture

### Tech Stack Integration

- **Frontend**: Next.js 14 (App Router) + shadcn/ui components
- **Voice AI**: ElevenLabs Conversational AI
- **Speech-to-Text**: WisprFlow STT (via ElevenLabs integration)
- **Contactless Vitals**: Presage Tech rPPG
- **Medical Reasoning**: Gemini AI
- **Blockchain**: Kairo (Kaia) Smart Contracts

### The Shield Implementation

The "Shield" refers to our blockchain verification system:

1. **Clinical Synthesis**: Gemini AI analyzes conversation + vitals → generates structured report
2. **Cryptographic Hashing**: SHA-256 hash created from the complete intake data
3. **Blockchain Storage**: Hash submitted to Kairo `VerifiableIntakeProtocol` smart contract
4. **Immutable Record**: Creates legal "Source of Truth" for medical documentation

## File Structure

```
src/
├── app/
│   └── (public)/                    # Public route group
│       ├── page.tsx                 # Landing page (/)
│       └── scheduling/
│           └── page.tsx             # Triage page (/scheduling)
├── components/
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   └── emi/                         # EMI-specific components
│       ├── VoiceInterface.tsx       # ElevenLabs integration
│       ├── VitalMonitor.tsx         # Presage rPPG display
│       └── ReportPreview.tsx        # Clinical report display
├── hooks/
│   ├── useVitals.ts                 # Presage vitals hook
│   └── useTriage.ts                 # Triage state management
├── lib/
│   ├── blockchain.ts                # Kairo contract interactions
│   ├── elevenlabs.ts                # Voice AI integration
│   ├── gemini.ts                    # Clinical synthesis
│   ├── presage.ts                   # rPPG vitals SDK
│   └── wisprflow.ts                 # Speech-to-text
└── contracts/
    └── VerifiableIntakeProtocol.sol # Kairo smart contract
```

## User Flow

### Phase 1: Patient Information
- Users enter basic demographic info (name, DOB, contact)
- Simple, warm form interface
- "Start Intake with Emi" button triggers triage

### Phase 2: Live Triage
- **Left Panel**: Voice interface with Emi
  - Pulsating orb visualizer
  - Real-time transcript display
  - Natural conversation flow
  
- **Right Panel**: Contactless Vitals Monitor
  - Live camera feed with face detection overlay
  - Real-time vital signs (HR, SpO2, RR)
  - Signal quality indicators

### Phase 3: Clinical Synthesis
- Loading state while Gemini processes data
- Generates structured clinical report:
  - Chief complaint
  - Symptoms list
  - Vital signs summary
  - Clinical impression
  - Differential diagnoses
  - Recommendations
  - Triage level (emergent/urgent/less-urgent/non-urgent)

### Phase 4: Blockchain Verification
- Display generated clinical report
- Show SHA-256 hash of report data
- "Verify on Blockchain" button
- Submit to Kairo contract
- Display transaction hash

### Phase 5: Complete
- Success confirmation
- Session ID for reference
- Blockchain transaction hash
- Report hash for verification
- Download/print options

## Environment Variables

Create a `.env.local` file:

```env
# ElevenLabs Voice AI
ELEVENLABS_API_KEY=your_elevenlabs_api_key
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id

# Presage Tech rPPG
NEXT_PUBLIC_PRESAGE_API_KEY=your_presage_api_key

# Google Gemini AI
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# Kairo Blockchain
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
NEXT_PUBLIC_RPC_URL=https://rpc.kaia.io
VERIFIABLE_INTAKE_PRIVATE_KEY=your_private_key_for_deployment

# WisprFlow (if separate from ElevenLabs)
WISPRFLOW_API_KEY=your_wisprflow_api_key
```

## Running the Application

### Development Mode

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start local Hardhat node (for blockchain testing)
npx hardhat node

# Deploy contract to local network
npm run deploy:local

# Start Next.js dev server
npm run dev
```

Visit `http://localhost:3000` to see the landing page.

### Production Deployment

1. **Deploy Smart Contract to Kairo Mainnet**
   ```bash
   npm run deploy:sepolia  # Test on Sepolia first
   # or
   npm run deploy:polygon  # Deploy to production
   ```

2. **Update Environment Variables**
   - Add production contract address
   - Use production RPC URL
   - Configure production API keys

3. **Build and Deploy Next.js**
   ```bash
   npm run build
   npm run start
   ```

## Key Features

### 1. Digital Companion Experience
- Warm, empathetic UI design
- Conversational flow (not clinical forms)
- Real-time feedback and guidance
- Progressive disclosure of information

### 2. Privacy by Design
- Video processed locally (never stored)
- Only vitals and transcript saved
- End-to-end encryption for sensitive data
- HIPAA-compliant data handling

### 3. Blockchain Verification
- Immutable medical record hashing
- Cryptographic proof of integrity
- Legal-grade audit trail
- Patient-owned data sovereignty

### 4. Clinical Intelligence
- AI-powered symptom analysis
- Vital signs correlation
- Evidence-based recommendations
- Appropriate triage prioritization

## Testing

### Local Testing Checklist

- [ ] Landing page loads with all sections visible
- [ ] "Start Intake" button navigates to scheduling page
- [ ] Patient info form validates required fields
- [ ] Voice interface connects to ElevenLabs
- [ ] Camera permission requested for vitals
- [ ] Vitals monitor displays heart rate, SpO2, RR
- [ ] Transcript updates in real-time during conversation
- [ ] Clinical report generates after conversation ends
- [ ] SHA-256 hash displayed correctly
- [ ] Blockchain submission succeeds
- [ ] Transaction hash returned and displayed
- [ ] Completion screen shows all session details

### Smart Contract Testing

```bash
npm run test:contract
```

## Troubleshooting

### Voice Interface Issues
- **Problem**: "MetaMask not installed" error
  - **Solution**: Ensure you're testing in a browser with MetaMask extension
  - **Alternative**: Mock the wallet connection for development

### Vitals Monitor Issues
- **Problem**: Camera not connecting
  - **Solution**: Ensure HTTPS is enabled (required for camera access)
  - **Solution**: Grant camera permissions in browser

### Blockchain Submission Issues
- **Problem**: Transaction fails
  - **Solution**: Check wallet has sufficient funds for gas
  - **Solution**: Verify contract address is correct in `.env.local`
  - **Solution**: Ensure you're connected to the correct network

### Gemini Synthesis Issues
- **Problem**: Report generation fails
  - **Solution**: Verify `GOOGLE_GEMINI_API_KEY` is valid
  - **Solution**: Check API quota limits
  - **Solution**: Review transcript data format

## API Integration Details

### ElevenLabs Integration
- Uses Conversational AI SDK
- Signed URL approach for security
- Real-time bidirectional audio streaming
- Automatic conversation state management

### Presage Tech Integration
- rPPG (remote photoplethysmography) for contactless vitals
- Requires good lighting and stable camera view
- Face detection with confidence scoring
- Real-time signal quality feedback

### Gemini AI Integration
- Clinical synthesis prompt engineering
- Structured JSON output
- Temperature: 0.3 (consistent medical output)
- Model: gemini-1.5-pro

### Kairo Blockchain Integration
- Uses ethers.js v6
- Keccak-256 hashing (Ethereum standard)
- Gas estimation and error handling
- Event emission for verification

## Design Principles

### 1. Trust Through Transparency
- Clear explanations of what's happening
- Visible progress indicators
- Privacy notices at key points
- Blockchain verification as trust signal

### 2. Empathetic Design
- Warm color palette (emerald, cyan, violet)
- Conversational copy (not clinical jargon)
- Encouraging tone and micro-interactions
- Progressive disclosure (not overwhelming)

### 3. Medical Grade Precision
- Structured clinical data capture
- Evidence-based recommendations
- Appropriate urgency assessment
- Professional terminology where needed

### 4. Future-Ready Architecture
- Modular component design
- Type-safe interfaces
- Extensible state management
- Blockchain-ready infrastructure

## Next Steps

### Immediate Enhancements
1. Add actual Gemini API integration (currently using mock data)
2. Implement real WisprFlow STT if separate from ElevenLabs
3. Add user authentication and session management
4. Implement proper error boundaries and fallbacks
5. Add comprehensive analytics and monitoring

### Future Features
1. Multi-language support
2. Accessibility improvements (WCAG AAA)
3. Mobile app (React Native)
4. Provider dashboard for reviewing intakes
5. Integration with EHR systems
6. Advanced vitals (blood pressure, temperature)
7. Symptom checker with medical knowledge graph

## Support

For technical issues or questions:
- Review the existing documentation in `/docs`
- Check the smart contract documentation in `BLOCKCHAIN_INTEGRATION.md`
- Review the deployment guide in `DEPLOYMENT_GUIDE.md`

## License

Proprietary - Aegis Health © 2026
