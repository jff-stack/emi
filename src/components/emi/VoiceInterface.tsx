"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import {
    TranscriptMessage,
    generateSessionId,
    generateDynamicSystemPrompt,
    EMI_PERSONA,
} from "@/lib/elevenlabs";

/**
 * @description Props for the VoiceInterface component
 */
interface VoiceInterfaceProps {
    /** Callback when conversation ends with full transcript */
    onConversationEnd?: (transcript: TranscriptMessage[], conversationId: string) => void;
    /** Callback for real-time transcript updates */
    onTranscriptUpdate?: (messages: TranscriptMessage[]) => void;
    /** Callback when speaking state changes (for biofeedback) */
    onSpeakingChange?: (isSpeaking: boolean) => void;
    /** Whether the voice interface should be active */
    isActive?: boolean;
}

/**
 * @description Emi Voice Interface - ElevenLabs Conversational AI
 *
 * Uses signed URLs for secure API key handling.
 * Features a pulsating orb that changes color based on conversation state.
 *
 * @example
 * ```tsx
 * <VoiceInterface
 *   onConversationEnd={(transcript, id) => console.log("Ended:", id)}
 *   isActive={true}
 * />
 * ```
 */
export function VoiceInterface({
    onConversationEnd,
    onTranscriptUpdate,
    onSpeakingChange,
    isActive = true,
}: VoiceInterfaceProps) {
    // Session tracking for Kairo - only generate on client side to avoid hydration mismatch
    const [sessionId, setSessionId] = useState<string>("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
    const [turnCount, setTurnCount] = useState(0);

    // UI state
    const [currentCaption, setCurrentCaption] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);

    // Track if component is mounted to prevent double-connection from React Strict Mode
    const isMountedRef = useRef(true);
    const hasStartedRef = useRef(false);

    // Generate session ID only on client side and track mount state
    useEffect(() => {
        isMountedRef.current = true;
        hasStartedRef.current = false;
        setSessionId(generateSessionId());

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Notify parent of transcript updates
    useEffect(() => {
        if (transcript.length > 0) {
            onTranscriptUpdate?.(transcript);
        }
    }, [transcript, onTranscriptUpdate]);

    /**
     * ElevenLabs conversation hook
     */
    const conversation = useConversation({
        onConnect: () => {
            console.log(`[${sessionId}] Connected to ElevenLabs`);
            setError(null);
        },
        onDisconnect: () => {
            console.log(`[${sessionId}] Disconnected from ElevenLabs`);
            // Reset hasStarted so user can start a new conversation
            hasStartedRef.current = false;
            // Log conversation ID for Kairo verification
            if (conversationId) {
                console.log(`[KAIRO] Conversation ID for verification: ${conversationId}`);
            }
        },
        onMessage: (message) => {
            const newMessage: TranscriptMessage = {
                role: message.source === "user" ? "user" : "agent",
                text: message.message,
                timestamp: new Date(),
            };

            setTranscript((prev) => [...prev, newMessage]);

            // Track turn count for dynamic prompt context (each user turn = 1 turn)
            if (message.source === "user") {
                setTurnCount((prev) => prev + 1);
            }

            // Update caption
            setCurrentCaption(message.message);
        },
        onError: (err) => {
            console.error(`[${sessionId}] ElevenLabs error:`, err);
            console.error(`[${sessionId}] Error type:`, typeof err);
            console.error(`[${sessionId}] Error details:`, JSON.stringify(err, null, 2));

            // Try to extract meaningful error message
            let errorMessage = "Unknown error occurred";
            if (typeof err === "string") {
                errorMessage = err;
            } else if (err && typeof err === "object") {
                errorMessage = (err as { message?: string }).message ||
                    (err as { error?: string }).error ||
                    JSON.stringify(err);
            }
            setError(errorMessage);
            hasStartedRef.current = false; // Allow retry on error
        },
    });

    // Notify parent of speaking state changes (for biofeedback)
    useEffect(() => {
        onSpeakingChange?.(conversation.isSpeaking);
    }, [conversation.isSpeaking, onSpeakingChange]);

    /**
     * Fetch signed URL from our secure API route
     */
    const getSignedUrl = async (): Promise<string> => {
        const response = await fetch("/api/get-signed-url");

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to get signed URL");
        }

        const data = await response.json();
        return data.signedUrl;
    };

    /**
     * Start the conversation using signed URL
     */
    const startConversation = useCallback(async () => {
        console.log(`[${sessionId}] Begin Intake clicked. hasStarted=${hasStartedRef.current}, isMounted=${isMountedRef.current}`);

        // Prevent double-start from React Strict Mode or rapid clicks
        if (hasStartedRef.current || !isMountedRef.current) {
            console.log(`[${sessionId}] Ignoring duplicate start request`);
            return;
        }
        hasStartedRef.current = true;
        console.log(`[${sessionId}] Starting conversation...`);

        setIsStarting(true);
        setError(null);

        try {
            // Request microphone permission first
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // Check if still mounted after async operation
            if (!isMountedRef.current) {
                console.log(`[${sessionId}] Component unmounted, aborting start`);
                return;
            }

            // Get signed URL from our API
            const signedUrl = await getSignedUrl();

            // Check if still mounted after async operation
            if (!isMountedRef.current) {
                console.log(`[${sessionId}] Component unmounted, aborting start`);
                return;
            }

            // Start the conversation with signed URL
            // Note: Removed overrides - using agent's default config from ElevenLabs dashboard
            // If you need custom prompts, configure them in the ElevenLabs dashboard
            const convId = await conversation.startSession({
                signedUrl,
            });

            // Store conversation ID for Kairo (only if still mounted)
            if (convId && isMountedRef.current) {
                setConversationId(convId);
                console.log(`[${sessionId}] Started conversation: ${convId}`);
            }
        } catch (err) {
            console.error("Failed to start conversation:", err);
            if (!isMountedRef.current) return;

            if (err instanceof DOMException && err.name === "NotAllowedError") {
                setError("Microphone access denied. Please enable microphone permissions.");
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to start conversation. Please try again.");
            }
            // Reset hasStarted on error so user can retry
            hasStartedRef.current = false;
        } finally {
            if (isMountedRef.current) {
                setIsStarting(false);
            }
        }
    }, [conversation, sessionId]);

    /**
     * End the conversation and trigger callback
     */
    const endConversation = useCallback(async () => {
        await conversation.endSession();

        // Pass transcript and conversation ID to parent
        if (transcript.length > 0 && conversationId) {
            console.log(`[KAIRO] Session ${conversationId} ended with ${transcript.length} messages`);
            onConversationEnd?.(transcript, conversationId);
        }

        // Reset for next conversation
        setTranscript([]);
        setConversationId(null);
        setCurrentCaption("");
        setTurnCount(0);
    }, [conversation, onConversationEnd, transcript, conversationId]);

    const isConnected = conversation.status === "connected";

    // Generate waveform bar heights based on speaking state
    const getWaveformBars = () => {
        const barCount = 5;
        return Array.from({ length: barCount }, (_, i) => {
            const baseHeight = conversation.isSpeaking ? 40 : 20;
            const variance = conversation.isSpeaking ? 30 : 5;
            return baseHeight + Math.sin(Date.now() / 200 + i * 0.5) * variance;
        });
    };

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Clean Voice Waveform Visualization */}
            <div className="relative flex items-center justify-center">
                <div className={`flex items-center justify-center gap-1 p-8 rounded-2xl border transition-all duration-300 ${isConnected
                    ? conversation.isSpeaking
                        ? "border-[#0055A5] bg-blue-50 dark:bg-blue-950/30"
                        : "border-green-500 bg-green-50 dark:bg-green-950/30"
                    : "border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800"
                    }`}>
                    {/* Waveform Bars */}
                    <div className="flex items-center gap-1 h-16">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 rounded-full transition-all duration-150 ${isConnected
                                    ? conversation.isSpeaking
                                        ? "bg-[#0055A5]"
                                        : "bg-green-500"
                                    : "bg-gray-300 dark:bg-slate-600"
                                    }`}
                                style={{
                                    height: isConnected && conversation.isSpeaking
                                        ? `${20 + Math.sin(Date.now() / 150 + i * 0.8) * 25}px`
                                        : isConnected
                                            ? `${15 + Math.sin(Date.now() / 300 + i * 0.5) * 10}px`
                                            : '20px',
                                    animation: isConnected ? `waveform ${0.6 + i * 0.1}s ease-in-out infinite` : 'none',
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Text - Clean Typography */}
            <div className="text-center">
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {isStarting
                        ? "Connecting..."
                        : !isConnected
                            ? "Virtual Intake Assistant"
                            : conversation.isSpeaking
                                ? "Emi is speaking..."
                                : "Listening..."}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {isConnected
                        ? "Speak naturally — I'm here to help"
                        : "Click below to begin your virtual visit"}
                </p>
            </div>

            {/* Real-time Captions - Clean Card */}
            {isConnected && currentCaption && (
                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                        {conversation.isSpeaking ? "Emi" : "You"}
                    </p>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{currentCaption}</p>
                </div>
            )}

            {/* Control Buttons - Clean Clinical Style */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
                {!isConnected ? (
                    <button
                        onClick={startConversation}
                        disabled={!isActive || isStarting}
                        className={`w-full py-3 px-6 rounded-lg font-semibold text-base transition-all shadow-sm ${isActive && !isStarting
                            ? "bg-[#0055A5] hover:bg-[#004080] text-white"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500"
                            }`}
                    >
                        {isStarting ? "Connecting..." : "Begin Intake"}
                    </button>
                ) : (
                    <button
                        onClick={endConversation}
                        className="w-full py-3 px-6 rounded-lg font-semibold text-base bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all"
                    >
                        Complete Visit
                    </button>
                )}
            </div>

            {/* Error Messages - Clean Alert */}
            {error && (
                <div className="w-full max-w-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                        <svg
                            className="w-5 h-5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        {error}
                    </p>
                </div>
            )}

            {/* Session ID - Subtle */}
            <div className="text-xs text-slate-400 dark:text-slate-600 space-y-1 text-center">
                {conversationId && <p>Session: {conversationId.slice(0, 8)}...</p>}
            </div>
        </div>
    );
}
