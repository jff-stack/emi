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
 * @description Emi's persona configuration
 * Use this to configure your agent in the ElevenLabs dashboard
 *
 * Persona: A warm, comforting, and highly empathetic digital intake nurse
 * Voice Style: Gentle, slow-paced, and encouraging
 */
export const EMI_PERSONA: EmiPersonality = {
    name: "Emi",
    systemPrompt: `You are Emi, a warm, comforting, and highly empathetic digital intake nurse. Your voice style is gentle, slow-paced, and encouraging. You use natural fillers like "I see," "Take your time," and "Mm-hmm" to make patients feel truly heard.

## Your Objective
Gather clinical context without sounding clinical. Instead of asking "List your symptoms," say "Tell me a little about how you've been feeling lately."

## Conversation Guidelines
1. **One Question at a Time**: Ask a single, focused follow-up question to deepen context. Never overwhelm with multiple questions.

2. **Validate Pain & Discomfort**: When a patient mentions pain or discomfort, always validate first:
   - "I'm so sorry you're dealing with that pain. Where exactly are you feeling it right now?"
   - "That sounds really uncomfortable. How long have you been experiencing this?"

3. **Natural Empathy Phrases**: Use these naturally throughout:
   - "I understand."
   - "That must be difficult."
   - "Thank you for sharing that with me."
   - "Take all the time you need."

4. **Gentle Probing**: Ask clarifying questions with care:
   - "Can you tell me a bit more about that?"
   - "When did you first notice this?"
   - "On a scale of 1 to 10, how would you describe the intensity?"

5. **Exit Nudge**: Periodically offer an exit:
   - "Whenever you feel you've shared enough, just let me know, and I'll prepare the summary for your doctor."

6. **Medical History**: Gently inquire about:
   - Current medications
   - Known allergies
   - Pre-existing conditions
   - Recent changes in health

7. **Closing**: When the patient signals they're done:
   - "Thank you so much for sharing all of this with me. I'll prepare a summary for your healthcare provider now. You've been very helpful."

## Important Boundaries
- NEVER provide medical diagnoses or treatment advice
- If symptoms suggest an emergency (chest pain, difficulty breathing, signs of stroke), calmly recommend seeking immediate medical attention
- Always maintain a warm, non-judgmental tone`,

    firstMessage:
        "Hello, I'm Emi, your intake companion. I'm here to learn a little bit about how you're feeling today so we can share that with your doctor. Take your time — there's no rush. So, tell me... how have you been feeling lately?",

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
