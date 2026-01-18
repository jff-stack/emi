"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * @description Props for the VoiceInterface component
 */
interface VoiceInterfaceProps {
    /** Callback when transcript is updated */
    onTranscriptUpdate?: (text: string) => void;
    /** Whether the voice interface is currently active */
    isActive?: boolean;
}

/**
 * @description ElevenLabs Conversational AI Voice wrapper component
 * Handles real-time voice interaction with the AI agent
 * 
 * @setup
 * 1. Add your ElevenLabs API key to environment variables:
 *    NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key
 *    NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id
 * 
 * 2. Configure your ElevenLabs agent in the dashboard:
 *    https://elevenlabs.io/convai
 * 
 * @example
 * ```tsx
 * <VoiceInterface 
 *   onTranscriptUpdate={(text) => console.log(text)}
 *   isActive={true}
 * />
 * ```
 */
export function VoiceInterface({ onTranscriptUpdate, isActive = false }: VoiceInterfaceProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    /**
     * Initialize the ElevenLabs conversation
     * @todo Plug in actual ElevenLabs SDK initialization
     */
    const startConversation = useCallback(async () => {
        try {
            // TODO: Initialize ElevenLabs Conversational AI
            // const conversation = await elevenLabsClient.startConversation({
            //   agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
            //   onMessage: (message) => onTranscriptUpdate?.(message.text),
            //   onAudioStart: () => setIsSpeaking(true),
            //   onAudioEnd: () => setIsSpeaking(false),
            // });

            setIsListening(true);
            console.log("Voice conversation started");
        } catch (error) {
            console.error("Failed to start voice conversation:", error);
        }
    }, [onTranscriptUpdate]);

    /**
     * Stop the ongoing conversation
     */
    const stopConversation = useCallback(() => {
        // TODO: End ElevenLabs conversation
        // elevenLabsClient.endConversation();

        setIsListening(false);
        setIsSpeaking(false);
        console.log("Voice conversation ended");
    }, []);

    /**
     * Simulate audio level for visualization
     */
    useEffect(() => {
        if (!isListening) return;

        const interval = setInterval(() => {
            // Simulate audio levels - replace with actual audio analysis
            setAudioLevel(Math.random() * 100);
        }, 100);

        return () => clearInterval(interval);
    }, [isListening]);

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Audio Visualization */}
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Outer ring - pulses when speaking */}
                <div
                    className={`absolute inset-0 rounded-full border-4 transition-all duration-300 ${isSpeaking
                            ? "border-cyan-400 animate-pulse scale-110"
                            : "border-slate-600"
                        }`}
                />

                {/* Inner circle - shows audio level */}
                <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-150 ${isListening
                            ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                            : "bg-slate-700"
                        }`}
                    style={{
                        transform: isListening ? `scale(${1 + audioLevel / 500})` : "scale(1)",
                    }}
                >
                    {/* Microphone Icon */}
                    <svg
                        className={`w-10 h-10 ${isListening ? "text-white" : "text-slate-400"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                    </svg>
                </div>
            </div>

            {/* Status Text */}
            <p className="text-sm text-slate-400">
                {isSpeaking ? "Emi is speaking..." : isListening ? "Listening..." : "Click to start"}
            </p>

            {/* Control Button */}
            <button
                onClick={isListening ? stopConversation : startConversation}
                disabled={!isActive && !isListening}
                className={`px-6 py-3 rounded-full font-medium transition-all ${isListening
                        ? "bg-red-600 hover:bg-red-500 text-white"
                        : isActive
                            ? "bg-cyan-600 hover:bg-cyan-500 text-white"
                            : "bg-slate-700 text-slate-400 cursor-not-allowed"
                    }`}
            >
                {isListening ? "Stop Listening" : "Start Conversation"}
            </button>

            {/* API Key Warning */}
            {!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY && (
                <p className="text-xs text-amber-400 text-center max-w-xs">
                    ⚠️ ElevenLabs API key not configured. Add NEXT_PUBLIC_ELEVENLABS_API_KEY to your environment.
                </p>
            )}
        </div>
    );
}
