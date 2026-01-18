/**
 * @fileoverview WisprFlow clinical transcription service stub
 * Handles real-time medical transcription with clinical terminology support
 * 
 * @setup
 * 1. Add your WisprFlow credentials to environment variables:
 *    NEXT_PUBLIC_WISPRFLOW_API_KEY=your_api_key
 * 
 * 2. Review WisprFlow documentation for integration:
 *    https://wisprflow.com/docs
 * 
 * @see https://wisprflow.com
 */

/**
 * @description Configuration for the WisprFlow transcription service
 */
export interface WisprFlowConfig {
    /** API key for authentication */
    apiKey: string;
    /** Language code for transcription */
    language?: string;
    /** Enable medical vocabulary enhancement */
    medicalMode?: boolean;
    /** Custom vocabulary terms (e.g., drug names, conditions) */
    customVocabulary?: string[];
    /** Enable real-time streaming */
    streaming?: boolean;
}

/**
 * @description A single transcription segment
 */
export interface TranscriptionSegment {
    /** Unique segment identifier */
    id: string;
    /** Transcribed text */
    text: string;
    /** Start time in seconds */
    startTime: number;
    /** End time in seconds */
    endTime: number;
    /** Confidence score (0-1) */
    confidence: number;
    /** Speaker identification (if enabled) */
    speaker?: string;
    /** Whether this is a final or interim result */
    isFinal: boolean;
}

/**
 * @description Medical entities extracted from transcription
 */
export interface MedicalEntity {
    /** Type of entity */
    type: "symptom" | "medication" | "condition" | "procedure" | "anatomy" | "measurement";
    /** The extracted text */
    text: string;
    /** Normalized/standardized form */
    normalized?: string;
    /** Start position in transcript */
    startIndex: number;
    /** End position in transcript */
    endIndex: number;
    /** Confidence score */
    confidence: number;
}

/**
 * @description Callbacks for transcription events
 */
export interface TranscriptionCallbacks {
    /** Called when a new transcription segment is received */
    onSegment?: (segment: TranscriptionSegment) => void;
    /** Called when medical entities are detected */
    onMedicalEntity?: (entity: MedicalEntity) => void;
    /** Called when an error occurs */
    onError?: (error: Error) => void;
    /** Called when transcription starts/stops */
    onStateChange?: (isActive: boolean) => void;
}

/**
 * @description Active transcription session
 */
export interface TranscriptionSession {
    /** Unique session identifier */
    sessionId: string;
    /** Whether transcription is active */
    isActive: boolean;
    /** Start transcription */
    start: () => Promise<void>;
    /** Stop transcription */
    stop: () => Promise<void>;
    /** Pause transcription */
    pause: () => void;
    /** Resume transcription */
    resume: () => void;
    /** Get all segments */
    getSegments: () => TranscriptionSegment[];
    /** Get extracted medical entities */
    getMedicalEntities: () => MedicalEntity[];
}

/**
 * @description Default configuration values
 */
const DEFAULT_CONFIG: Partial<WisprFlowConfig> = {
    language: "en-US",
    medicalMode: true,
    streaming: true,
};

/**
 * @description Create a WisprFlow client instance
 * @param config - Configuration options
 * @returns Configured WisprFlow client
 * 
 * @example
 * ```typescript
 * const client = createWisprFlowClient({
 *   apiKey: process.env.NEXT_PUBLIC_WISPRFLOW_API_KEY!,
 *   medicalMode: true,
 * });
 * ```
 */
export function createWisprFlowClient(config: WisprFlowConfig) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    // TODO: Initialize actual WisprFlow client
    // const client = new WisprFlowClient({
    //   apiKey: mergedConfig.apiKey,
    //   options: {
    //     language: mergedConfig.language,
    //     medicalVocabulary: mergedConfig.medicalMode,
    //   },
    // });

    return {
        config: mergedConfig,
        // client,
    };
}

/**
 * @description Start a new transcription session
 * @param callbacks - Event callbacks for transcription events
 * @returns Promise resolving to an active transcription session
 * 
 * @example
 * ```typescript
 * const session = await startTranscription({
 *   onSegment: (segment) => console.log(segment.text),
 *   onMedicalEntity: (entity) => console.log(`Found: ${entity.type} - ${entity.text}`),
 * });
 * 
 * // Start listening
 * await session.start();
 * 
 * // Later, stop transcription
 * await session.stop();
 * ```
 */
export async function startTranscription(
    callbacks: TranscriptionCallbacks = {}
): Promise<TranscriptionSession> {
    const apiKey = process.env.NEXT_PUBLIC_WISPRFLOW_API_KEY;

    if (!apiKey) {
        throw new Error(
            "WisprFlow API key not configured. Please add NEXT_PUBLIC_WISPRFLOW_API_KEY to your environment."
        );
    }

    // TODO: Implement actual WisprFlow transcription
    // const client = createWisprFlowClient({ apiKey });
    // const session = await client.client.createSession({ ... });

    const segments: TranscriptionSegment[] = [];
    const entities: MedicalEntity[] = [];

    // Placeholder session for development
    const placeholderSession: TranscriptionSession = {
        sessionId: `transcription-${Date.now()}`,
        isActive: false,
        start: async () => {
            console.log("Transcription started");
            callbacks.onStateChange?.(true);
        },
        stop: async () => {
            console.log("Transcription stopped");
            callbacks.onStateChange?.(false);
        },
        pause: () => {
            console.log("Transcription paused");
        },
        resume: () => {
            console.log("Transcription resumed");
        },
        getSegments: () => segments,
        getMedicalEntities: () => entities,
    };

    return placeholderSession;
}

/**
 * @description Common medical vocabulary for custom dictionary
 * Add these to your WisprFlow configuration for better accuracy
 */
export const MEDICAL_VOCABULARY = [
    // Common symptoms
    "dyspnea",
    "tachycardia",
    "bradycardia",
    "hypertension",
    "hypotension",
    "nausea",
    "vertigo",
    "syncope",
    "edema",
    "cyanosis",

    // Vital signs
    "systolic",
    "diastolic",
    "SpO2",
    "O2 saturation",
    "bpm",
    "mmHg",

    // Common conditions
    "diabetes",
    "hypertension",
    "asthma",
    "COPD",
    "CHF",
    "CAD",
    "GERD",
    "hypothyroidism",

    // Medications (examples)
    "metformin",
    "lisinopril",
    "atorvastatin",
    "omeprazole",
    "levothyroxine",
    "amlodipine",
];

/**
 * @description Format segments into a readable transcript
 * @param segments - Array of transcription segments
 * @returns Formatted transcript string
 */
export function formatTranscript(segments: TranscriptionSegment[]): string {
    return segments
        .filter((s) => s.isFinal)
        .map((s) => (s.speaker ? `[${s.speaker}]: ${s.text}` : s.text))
        .join("\n");
}
