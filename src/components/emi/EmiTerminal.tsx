"use client";

import { useState } from "react";
import { VoiceInterface } from "./VoiceInterface";
import { VitalMonitor } from "./VitalMonitor";
import { ReportPreview } from "./ReportPreview";
import { useTriage, TriageState } from "@/hooks/useTriage";
import { useVitals } from "@/hooks/useVitals";

/**
 * @description Main container component for the Emi AI Intake Companion
 * Orchestrates the voice interface, vital monitoring, and report preview
 * 
 * @example
 * ```tsx
 * <EmiTerminal />
 * ```
 */
export function EmiTerminal() {
    const { state, transcript, transition, reset } = useTriage();
    const { vitals, isConnected, connect, disconnect } = useVitals();
    const [showReport, setShowReport] = useState(false);

    /**
     * Handle conversation completion
     */
    const handleComplete = () => {
        setShowReport(true);
        transition("complete");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Voice Interface Panel */}
            <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-900/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-slate-100">
                        Voice Interface
                    </h2>
                    <StatusBadge state={state} />
                </div>
                <VoiceInterface
                    onTranscriptUpdate={(text) => console.log("Transcript:", text)}
                    isActive={state !== "idle" && state !== "complete"}
                />
            </div>

            {/* Vitals Monitor Panel */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">
                    Vital Signs
                </h2>
                <VitalMonitor
                    vitals={vitals}
                    isConnected={isConnected}
                    onConnect={connect}
                    onDisconnect={disconnect}
                />
            </div>

            {/* Transcript Panel */}
            <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-900/50 p-6 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">
                    Conversation Transcript
                </h2>
                <div className="min-h-[200px] rounded-lg bg-slate-800/50 p-4 text-slate-300 font-mono text-sm">
                    {transcript.length > 0 ? (
                        transcript.map((entry, idx) => (
                            <p key={idx} className="mb-2">
                                <span className="text-cyan-400">[{entry.speaker}]:</span> {entry.text}
                            </p>
                        ))
                    ) : (
                        <p className="text-slate-500 italic">
                            Waiting for conversation to begin...
                        </p>
                    )}
                </div>
            </div>

            {/* Action Controls */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">
                    Controls
                </h2>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => transition("greeting")}
                        disabled={state !== "idle"}
                        className="w-full py-3 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
                    >
                        Start Intake
                    </button>
                    <button
                        onClick={handleComplete}
                        disabled={state === "idle" || state === "complete"}
                        className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
                    >
                        Generate Report
                    </button>
                    <button
                        onClick={() => {
                            reset();
                            setShowReport(false);
                        }}
                        className="w-full py-3 px-4 rounded-lg border border-slate-600 hover:bg-slate-800 text-slate-300 font-medium transition-colors"
                    >
                        Reset Session
                    </button>
                </div>
            </div>

            {/* Report Preview Modal */}
            {showReport && (
                <div className="lg:col-span-3">
                    <ReportPreview
                        transcript={transcript}
                        vitals={vitals}
                        onClose={() => setShowReport(false)}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * @description Status badge component showing current triage state
 */
function StatusBadge({ state }: { state: TriageState }) {
    const stateColors: Record<TriageState, string> = {
        idle: "bg-slate-600",
        greeting: "bg-blue-600",
        symptoms: "bg-amber-600",
        vitals: "bg-purple-600",
        history: "bg-indigo-600",
        synthesis: "bg-cyan-600",
        complete: "bg-emerald-600",
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${stateColors[state]}`}>
            {state.charAt(0).toUpperCase() + state.slice(1)}
        </span>
    );
}
