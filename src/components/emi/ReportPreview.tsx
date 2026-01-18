"use client";

import { useState } from "react";
import { VitalsData } from "@/hooks/useVitals";
import { TranscriptEntry } from "@/hooks/useTriage";

/**
 * @description Props for the ReportPreview component
 */
interface ReportPreviewProps {
    /** Conversation transcript entries */
    transcript: TranscriptEntry[];
    /** Collected vital signs data */
    vitals: VitalsData;
    /** Callback to close the report preview */
    onClose: () => void;
}

/**
 * @description Clinical report that would be generated from intake
 */
interface ClinicalReport {
    /** Report unique identifier */
    id: string;
    /** Patient summary */
    summary: string;
    /** Chief complaint extracted from conversation */
    chiefComplaint: string;
    /** Symptoms mentioned */
    symptoms: string[];
    /** Vital signs at time of intake */
    vitals: VitalsData;
    /** AI-generated clinical impression */
    clinicalImpression: string;
    /** Recommended next steps */
    recommendations: string[];
    /** Triage urgency level */
    urgencyLevel: "routine" | "urgent" | "emergent";
    /** Timestamp of report generation */
    generatedAt: Date;
    /** Blockchain verification hash */
    verificationHash: string | null;
}

/**
 * @description Final doctor's summary view component
 * Displays the synthesized clinical report from Gemini AI
 * and provides blockchain verification via Kairo
 * 
 * @setup
 * 1. Configure Gemini API for clinical synthesis:
 *    GOOGLE_GEMINI_API_KEY=your_api_key
 * 
 * 2. Configure Kairo for blockchain verification:
 *    NEXT_PUBLIC_KAIRO_CONTRACT_ADDRESS=your_contract_address
 * 
 * @example
 * ```tsx
 * <ReportPreview 
 *   transcript={transcript}
 *   vitals={vitals}
 *   onClose={() => setShowReport(false)}
 * />
 * ```
 */
export function ReportPreview({ transcript, vitals, onClose }: ReportPreviewProps) {
    const [report, setReport] = useState<ClinicalReport | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Generate clinical report using Gemini API
     * @todo Integrate with actual Gemini synthesis service
     */
    const generateReport = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            // TODO: Call actual Gemini synthesis API
            // const response = await synthesizeClinicalReport({
            //   transcript,
            //   vitals,
            // });

            // Simulated report for demonstration
            const mockReport: ClinicalReport = {
                id: `RPT-${Date.now()}`,
                summary: "Patient presents with symptoms requiring clinical evaluation.",
                chiefComplaint: "Symptoms as discussed during intake conversation.",
                symptoms: ["To be extracted from transcript"],
                vitals: vitals,
                clinicalImpression: "Clinical impression pending full transcript analysis via Gemini API.",
                recommendations: [
                    "Complete clinical evaluation recommended",
                    "Follow up with primary care provider",
                    "Continue monitoring vital signs",
                ],
                urgencyLevel: "routine",
                generatedAt: new Date(),
                verificationHash: null,
            };

            setReport(mockReport);
        } catch (err) {
            setError("Failed to generate clinical report. Please try again.");
            console.error("Report generation error:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    /**
     * Verify report on blockchain via Kairo
     * @todo Integrate with actual Kairo smart contract
     */
    const verifyOnBlockchain = async () => {
        if (!report) return;

        setIsVerifying(true);

        try {
            // TODO: Call Kairo verification service
            // const hash = await registerReportHash(report);

            // Simulated verification
            const mockHash = `0x${Array.from({ length: 64 }, () =>
                Math.floor(Math.random() * 16).toString(16)
            ).join("")}`;

            setReport({ ...report, verificationHash: mockHash });
        } catch (err) {
            setError("Failed to verify on blockchain. Please try again.");
            console.error("Verification error:", err);
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
                <h2 className="text-xl font-semibold text-slate-100">
                    Clinical Report Preview
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                {!report ? (
                    <div className="text-center py-12">
                        <p className="text-slate-400 mb-6">
                            Ready to synthesize clinical report from intake data.
                        </p>
                        <button
                            onClick={generateReport}
                            disabled={isGenerating}
                            className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-medium transition-colors"
                        >
                            {isGenerating ? (
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Generating...
                                </span>
                            ) : (
                                "Generate Report with Gemini"
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Report ID & Timestamp */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Report ID: <code className="text-cyan-400">{report.id}</code></span>
                            <span className="text-slate-500">{report.generatedAt.toLocaleString()}</span>
                        </div>

                        {/* Urgency Badge */}
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${report.urgencyLevel === "emergent" ? "bg-red-600 text-white" :
                                    report.urgencyLevel === "urgent" ? "bg-amber-600 text-white" :
                                        "bg-emerald-600 text-white"
                                }`}>
                                {report.urgencyLevel.charAt(0).toUpperCase() + report.urgencyLevel.slice(1)} Priority
                            </span>
                        </div>

                        {/* Summary */}
                        <section>
                            <h3 className="text-lg font-semibold text-slate-200 mb-2">Summary</h3>
                            <p className="text-slate-300 bg-slate-800/50 rounded-lg p-4">{report.summary}</p>
                        </section>

                        {/* Chief Complaint */}
                        <section>
                            <h3 className="text-lg font-semibold text-slate-200 mb-2">Chief Complaint</h3>
                            <p className="text-slate-300">{report.chiefComplaint}</p>
                        </section>

                        {/* Clinical Impression */}
                        <section>
                            <h3 className="text-lg font-semibold text-slate-200 mb-2">Clinical Impression</h3>
                            <p className="text-slate-300 bg-slate-800/50 rounded-lg p-4">{report.clinicalImpression}</p>
                        </section>

                        {/* Recommendations */}
                        <section>
                            <h3 className="text-lg font-semibold text-slate-200 mb-2">Recommendations</h3>
                            <ul className="list-disc list-inside text-slate-300 space-y-1">
                                {report.recommendations.map((rec, idx) => (
                                    <li key={idx}>{rec}</li>
                                ))}
                            </ul>
                        </section>

                        {/* Vitals Snapshot */}
                        <section>
                            <h3 className="text-lg font-semibold text-slate-200 mb-2">Vital Signs at Intake</h3>
                            <div className="grid grid-cols-4 gap-4 text-center">
                                <div className="bg-slate-800/50 rounded-lg p-3">
                                    <p className="text-xs text-slate-400">Heart Rate</p>
                                    <p className="text-lg font-bold text-slate-200">{report.vitals.heartRate ?? "--"} bpm</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-3">
                                    <p className="text-xs text-slate-400">SpO2</p>
                                    <p className="text-lg font-bold text-slate-200">{report.vitals.spO2 ?? "--"}%</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-3">
                                    <p className="text-xs text-slate-400">Resp Rate</p>
                                    <p className="text-lg font-bold text-slate-200">{report.vitals.respiratoryRate ?? "--"}/min</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-3">
                                    <p className="text-xs text-slate-400">Blood Pressure</p>
                                    <p className="text-lg font-bold text-slate-200">
                                        {report.vitals.bloodPressure
                                            ? `${report.vitals.bloodPressure.systolic}/${report.vitals.bloodPressure.diastolic}`
                                            : "--"
                                        }
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Blockchain Verification */}
                        <section className="border-t border-slate-700 pt-6">
                            <h3 className="text-lg font-semibold text-slate-200 mb-2">Blockchain Verification</h3>
                            {report.verificationHash ? (
                                <div className="bg-emerald-900/20 border border-emerald-600/30 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium">Verified on Blockchain</span>
                                    </div>
                                    <code className="text-xs text-slate-400 break-all">{report.verificationHash}</code>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={verifyOnBlockchain}
                                        disabled={isVerifying}
                                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white font-medium transition-colors"
                                    >
                                        {isVerifying ? "Verifying..." : "Verify with Kairo"}
                                    </button>
                                    <p className="text-xs text-slate-500">
                                        Register report hash on-chain for immutable verification
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mt-4 p-4 bg-red-900/20 border border-red-600/30 rounded-lg text-red-400">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
