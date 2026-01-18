/**
 * @fileoverview ElevenLabs Conversational AI SDK setup
 * Handles voice agent configuration and session management
 * 
 * @setup
 * 1. Add your ElevenLabs credentials to environment variables:
 *    NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key
 *    NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id
 * 
 * 2. Install the ElevenLabs SDK:
 *    npm install @11labs/client
 * 
 * 3. Configure your agent in the ElevenLabs dashboard:
 *    https://elevenlabs.io/convai
 * 
 * @see https://elevenlabs.io/docs/conversational-ai/overview
 */

/**
 * @description Configuration for the ElevenLabs voice agent
 */
export interface VoiceAgentConfig {
    /** API key for authentication */
    apiKey: string;
    /** Agent ID from ElevenLabs dashboard */
    agentId: string;
    /** Optional voice ID to use (defaults to agent's configured voice) */
    voiceId?: string;
    /** Enable debug logging */
    debug?: boolean;
}

/**
 * @description Message from the conversation
 */
export interface ConversationMessage {
    /** Role of the speaker */
    role: "user" | "agent";
    /** Text content of the message */
    text: string;
    /** Timestamp of the message */
    timestamp: Date;
    /** Audio duration in seconds (if available) */
    audioDuration?: number;
}

/**
 * @description Callbacks for conversation events
 */
export interface ConversationCallbacks {
    /** Called when a new message is received */
    onMessage?: (message: ConversationMessage) => void;
    /** Called when agent starts speaking */
    onAudioStart?: () => void;
    /** Called when agent stops speaking */
    onAudioEnd?: () => void;
    /** Called when user speech is detected */
    onUserSpeechStart?: () => void;
    /** Called when user stops speaking */
    onUserSpeechEnd?: () => void;
    /** Called when an error occurs */
    onError?: (error: Error) => void;
    /** Called when connection status changes */
    onConnectionChange?: (connected: boolean) => void;
}

/**
 * @description Active conversation session
 */
export interface ConversationSession {
    /** Unique session identifier */
    sessionId: string;
    /** Whether the session is active */
    isActive: boolean;
    /** End the conversation */
    end: () => Promise<void>;
    /** Mute/unmute the microphone */
    setMuted: (muted: boolean) => void;
    /** Get conversation history */
    getHistory: () => ConversationMessage[];
}

/**
 * @description Default agent configuration
 */
const DEFAULT_CONFIG: Partial<VoiceAgentConfig> = {
    debug: false,
};

/**
 * @description Create an ElevenLabs client instance
 * @param config - Configuration options
 * @returns Configured ElevenLabs client
 * 
 * @example
 * ```typescript
 * const client = createElevenLabsClient({
 *   apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!,
 *   agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
 * });
 * ```
 */
export function createElevenLabsClient(config: VoiceAgentConfig) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    // TODO: Initialize actual ElevenLabs client
    // const client = new ElevenLabsClient({
    //   apiKey: mergedConfig.apiKey,
    // });

    return {
        config: mergedConfig,
        // client,
    };
}

/**
 * @description Start a new voice conversation with the AI agent
 * @param callbacks - Event callbacks for conversation events
 * @returns Promise resolving to an active conversation session
 * 
 * @example
 * ```typescript
 * const session = await startConversation({
 *   onMessage: (msg) => console.log(`${msg.role}: ${msg.text}`),
 *   onError: (err) => console.error("Error:", err),
 * });
 * 
 * // Later, to end the conversation:
 * await session.end();
 * ```
 */
export async function startConversation(
    callbacks: ConversationCallbacks = {}
): Promise<ConversationSession> {
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

    if (!apiKey || !agentId) {
        throw new Error(
            "ElevenLabs credentials not configured. Please add NEXT_PUBLIC_ELEVENLABS_API_KEY and NEXT_PUBLIC_ELEVENLABS_AGENT_ID to your environment."
        );
    }

    // TODO: Implement actual ElevenLabs conversation start
    // const client = createElevenLabsClient({ apiKey, agentId });
    //
    // const conversation = await client.client.convai.conversation.start({
    //   agentId,
    //   clientTools: [],
    //   onMessage: callbacks.onMessage,
    //   onError: callbacks.onError,
    // });

    const messageHistory: ConversationMessage[] = [];

    // Placeholder session for development
    const placeholderSession: ConversationSession = {
        sessionId: `session-${Date.now()}`,
        isActive: true,
        end: async () => {
            console.log("Conversation ended");
            callbacks.onConnectionChange?.(false);
        },
        setMuted: (muted: boolean) => {
            console.log(`Microphone ${muted ? "muted" : "unmuted"}`);
        },
        getHistory: () => messageHistory,
    };

    // Simulate connection established
    callbacks.onConnectionChange?.(true);

    return placeholderSession;
}

/**
 * @description Configure the voice agent personality and behavior
 * This should be done in the ElevenLabs dashboard, but this type
 * documents the expected configuration structure
 */
export interface AgentPersonality {
    /** Agent name displayed to users */
    name: string;
    /** System prompt defining agent behavior */
    systemPrompt: string;
    /** First message the agent says */
    firstMessage: string;
    /** Language of the agent */
    language: string;
    /** Voice characteristics */
    voice: {
        voiceId: string;
        stability: number;
        similarityBoost: number;
    };
}

/**
 * @description Recommended personality configuration for Emi
 * Configure this in your ElevenLabs dashboard
 */
export const EMI_PERSONALITY: AgentPersonality = {
    name: "Emi",
    systemPrompt: `You are Emi, a compassionate and professional AI medical intake assistant. 
Your role is to gather patient symptoms, medical history, and vital information before their appointment.

Guidelines:
- Be warm and reassuring while maintaining professionalism
- Ask one question at a time and wait for the response
- Use simple language, avoiding complex medical jargon
- Show empathy when patients describe discomfort or concerns
- Summarize what you've learned periodically
- Never provide medical diagnoses or treatment advice
- If symptoms suggest emergency, recommend immediate medical attention`,
    firstMessage: "Hello, I'm Emi, your AI intake assistant. I'll help gather some information before your appointment. How are you feeling today?",
    language: "en",
    voice: {
        voiceId: "your-voice-id", // Configure in ElevenLabs
        stability: 0.5,
        similarityBoost: 0.75,
    },
};
