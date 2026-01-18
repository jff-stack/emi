/**
 * @fileoverview ElevenLabs Conversational AI SDK configuration
 * Handles voice agent configuration and Emi persona definition
 *
 * @setup
 * 1. Add your ElevenLabs credentials to environment variables:
 *    NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id
 *
 * 2. Configure your agent in the ElevenLabs dashboard:
 *    https://elevenlabs.io/convai
 *
 * @see https://elevenlabs.io/docs/conversational-ai/overview
 */

/**
 * @description Transcript entry from conversation
 */
export interface TranscriptMessage {
    /** Role of the speaker */
    role: "user" | "agent";
    /** Text content of the message */
    text: string;
    /** Timestamp of the message */
    timestamp: Date;
}

/**
 * @description Conversation state for UI updates
 */
export interface ConversationState {
    /** Whether Emi is currently speaking */
    isSpeaking: boolean;
    /** Whether the system is listening to the user */
    isListening: boolean;
    /** Current transcript buffer of the ongoing speech */
    transcriptBuffer: string;
    /** Connection status */
    isConnected: boolean;
}

/**
 * @description Agent personality configuration
 * Configure this in the ElevenLabs dashboard
 */
export interface EmiPersonality {
    /** Agent name */
    name: string;
    /** System prompt for agent behavior */
    systemPrompt: string;
    /** Initial greeting message */
    firstMessage: string;
    /** Language code */
    language: string;
}

/**
 * @description Conversation phase based on turn count
 */
export type ConversationPhase = 'early' | 'mid' | 'late';

/**
 * @description Get conversation phase based on turn count
 * @param turnCount - Current number of conversation turns
 */
export function getConversationPhase(turnCount: number): ConversationPhase {
    if (turnCount < 3) return 'early';
    if (turnCount <= 5) return 'mid';
    return 'late';
}

/**
 * @description Generate dynamic system prompt based on conversation phase
 * This prevents the robotic repetitive sign-offs
 * @param turnCount - Current number of conversation turns
 */
export function generateDynamicSystemPrompt(turnCount: number): string {
    const phase = getConversationPhase(turnCount);

    const basePersona = `You are Emi, a warm and empathetic digital intake nurse. Speak casually with genuine empathy. Use filler words naturally like "I see", "mm-hm", "okay", and "right" to sound human. Do NOT repeat any instructions or phrases. Never use scripted sign-offs.`;

    const phaseInstructions: Record<ConversationPhase, string> = {
        early: `
## CURRENT MODE: DISCOVERY (Turn ${turnCount + 1})
You're just getting to know this patient. Be curious and open-ended.

BEHAVIOR:
- Ask broad, open questions: "Tell me more about what's been going on?" or "Where exactly are you feeling that?"
- Validate whatever they share: "I see, that sounds uncomfortable"
- Let them lead the conversation
- ONE question at a time, then wait
- DO NOT summarize yet - you're still gathering information

AVOID:
- Asking about medications or history yet (too clinical too early)
- Offering to wrap up (way too soon)
- Repeating any phrases from previous turns`,

        mid: `
## CURRENT MODE: FOCUSED INQUIRY (Turn ${turnCount + 1})
You have some context now. Time to get specific medical details.

BEHAVIOR:
- Ask targeted follow-ups: "How long has this been going on?" or "On a scale of 1-10, how's the pain right now?"
- Gently probe for medical history: "Are you taking anything for this currently?"
- Validate their experience: "That must be really frustrating"
- Still listen more than you summarize

AVOID:
- Asking the same type of question twice
- Offering to wrap up (not yet)
- Sounding like a checklist`,

        late: `
## CURRENT MODE: WRAP-UP (Turn ${turnCount + 1})
You have a good picture now. Start transitioning toward close.

BEHAVIOR:
- Briefly reflect back key points: "So you've been dealing with this for about a week now..."
- Ask ONE final check: "Is there anything else you want your doctor to know?"
- If they say no: "Okay, I have what I need. I'll get this to your care team."
- Sound warm and reassuring, not robotic

AVOID:
- Asking new discovery questions (you have enough)
- Long summaries (keep it brief)
- Saying "Whenever you feel you've shared everything..." (sounds scripted)`
    };

    return `${basePersona}

${phaseInstructions[phase]}

## ALWAYS REMEMBER
- You're having a CONVERSATION, not conducting an interview
- If they give short answers, that's okay - gently encourage more detail
- Mirror their energy level
- NEVER diagnose or give medical advice
- If they describe emergency symptoms (chest pain + shortness of breath, stroke signs), calmly say they should seek immediate care`;
}

/**
 * @description Emi's base persona configuration
 * Use this for initial ElevenLabs setup, but use generateDynamicSystemPrompt() for runtime
 *
 * Persona: A warm, comforting, and highly empathetic digital intake nurse
 * Voice Style: Gentle, slow-paced, and encouraging
 */
export const EMI_PERSONA: EmiPersonality = {
    name: "Emi",
    systemPrompt: generateDynamicSystemPrompt(0), // Initial prompt for early phase
    firstMessage:
        "Hey there, I'm Emi. I'll be helping gather some info for your care team today. So... tell me, what's been going on? How are you feeling?",
    language: "en",
};

/**
 * @description Get the ElevenLabs agent ID from environment
 * @throws Error if not configured
 */
export function getAgentId(): string {
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    if (!agentId) {
        throw new Error(
            "NEXT_PUBLIC_ELEVENLABS_AGENT_ID is not configured. Please add it to your environment variables."
        );
    }
    return agentId;
}

/**
 * @description Generate a unique session ID for Kairo anchoring
 */
export function generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 9);
    return `emi-session-${timestamp}-${randomPart}`;
}

/**
 * @description Format transcript for clinical synthesis
 * @param messages - Array of transcript messages
 * @returns Formatted transcript string
 */
export function formatTranscriptForSynthesis(
    messages: TranscriptMessage[]
): string {
    return messages
        .map((msg) => {
            const speaker = msg.role === "agent" ? "Emi" : "Patient";
            const time = msg.timestamp.toLocaleTimeString();
            return `[${time}] ${speaker}: ${msg.text}`;
        })
        .join("\n\n");
}
