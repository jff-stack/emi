"use client";

import { useCallback, useState, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import {
    TranscriptMessage,
    generateSessionId,
} from "@/lib/elevenlabs";

/**
 * @description Props for the VoiceInterface component
 */
interface VoiceInterfaceProps {
    /** Callback when conversation ends with full transcript */
    onConversationEnd?: (transcript: TranscriptMessage[], conversationId: string) => void;
    /** Callback for real-time transcript updates */
    onTranscriptUpdate?: (messages: TranscriptMessage[]) => void;
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
    isActive = true,
}: VoiceInterfaceProps) {
    // Session tracking for Kairo - only generate on client side to avoid hydration mismatch
    const [sessionId, setSessionId] = useState<string>("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);

    // UI state
    const [currentCaption, setCurrentCaption] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);

    // Generate session ID only on client side
    useEffect(() => {
        setSessionId(generateSessionId());
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

            // Update caption
            setCurrentCaption(message.message);
        },
        onError: (err) => {
            console.error(`[${sessionId}] ElevenLabs error:`, err);
            const errorMessage = typeof err === "string" ? err : String(err);
            setError(errorMessage);
        },
    });

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
        setIsStarting(true);
        setError(null);

        try {
            // Request microphone permission first
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // Get signed URL from our API
            const signedUrl = await getSignedUrl();

            // Start the conversation with signed URL
            // startSession returns the conversation ID as a string
            const convId = await conversation.startSession({
                signedUrl,
            });

            // Store conversation ID for Kairo
            if (convId) {
                setConversationId(convId);
                console.log(`[${sessionId}] Started conversation: ${convId}`);
            }
        } catch (err) {
            console.error("Failed to start conversation:", err);
            if (err instanceof DOMException && err.name === "NotAllowedError") {
                setError("Microphone access denied. Please enable microphone permissions.");
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to start conversation. Please try again.");
            }
        } finally {
            setIsStarting(false);
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
    }, [conversation, onConversationEnd, transcript, conversationId]);

    /**
     * Determine orb styles based on conversation status
     */
    const getOrbStyles = () => {
        const status = conversation.status;

        if (status === "connected") {
            // Pulsating green when connected (speaking/listening)
            return {
                background: conversation.isSpeaking
                    ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                    : "bg-gradient-to-br from-blue-400 to-cyan-500",
                glow: conversation.isSpeaking
                    ? "shadow-[0_0_60px_rgba(52,211,153,0.5)]"
                    : "shadow-[0_0_60px_rgba(59,130,246,0.5)]",
                pulse: "animate-pulse",
            };
        }

        // Static grey when disconnected
        return {
            background: "bg-slate-700",
            glow: "",
            pulse: "",
        };
    };

    const orbStyles = getOrbStyles();
    const isConnected = conversation.status === "connected";

    return (
        <div className="flex flex-col items-center gap-8">
            {/* Pulsating Orb */}
            <div className="relative flex items-center justify-center">
                {/* Outer glow */}
                <div
                    className={`absolute w-44 h-44 rounded-full transition-all duration-500 ${orbStyles.glow} ${orbStyles.pulse}`}
                />

                {/* Ripple effects when speaking */}
                {conversation.isSpeaking && (
                    <>
                        <div className="absolute w-40 h-40 rounded-full border-2 border-emerald-400/30 animate-ping" />
                        <div
                            className="absolute w-48 h-48 rounded-full border border-emerald-400/20 animate-ping"
                            style={{ animationDelay: "0.5s" }}
                        />
                    </>
                )}

                {/* Main orb */}
                <div
                    className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 ${orbStyles.background}`}
                >
                    {conversation.isSpeaking ? (
                        // Sound wave icon when speaking
                        <svg
                            className="w-14 h-14 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                            />
                        </svg>
                    ) : (
                        // Microphone icon
                        <svg
                            className="w-14 h-14 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                            />
                        </svg>
                    )}
                </div>
            </div>

            {/* Status Text */}
            <div className="text-center">
                <p className="text-lg font-medium text-slate-200">
                    {isStarting
                        ? "Connecting..."
                        : !isConnected
                            ? "Ready to begin"
                            : conversation.isSpeaking
                                ? "Emi is speaking..."
                                : "Listening to you..."}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                    {isConnected
                        ? "Speak naturally — I'm here to listen"
                        : "Click below to start your triage"}
                </p>
            </div>

            {/* Real-time Captions */}
            {isConnected && currentCaption && (
                <div className="w-full max-w-md bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">
                        {conversation.isSpeaking ? "Emi:" : "You:"}
                    </p>
                    <p className="text-slate-200 leading-relaxed">{currentCaption}</p>
                </div>
            )}

            {/* Control Buttons */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
                {!isConnected ? (
                    <button
                        onClick={startConversation}
                        disabled={!isActive || isStarting}
                        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${isActive && !isStarting
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg hover:shadow-cyan-500/25"
                            : "bg-slate-700 text-slate-400 cursor-not-allowed"
                            }`}
                    >
                        {isStarting ? "Connecting..." : "Start Triage"}
                    </button>
                ) : (
                    <button
                        onClick={endConversation}
                        className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg hover:shadow-emerald-500/25 transition-all"
                    >
                        Finish
                    </button>
                )}
            </div>

            {/* Error Messages */}
            {error && (
                <div className="w-full max-w-md bg-red-900/30 border border-red-700/50 rounded-xl p-4">
                    <p className="text-red-400 text-sm flex items-center gap-2">
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

            {/* Session/Conversation ID for debugging */}
            <div className="text-xs text-slate-600 space-y-1 text-center">
                {sessionId && <p>Session: {sessionId}</p>}
                {conversationId && <p>Conversation: {conversationId}</p>}
            </div>
        </div>
    );
}
