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
     */
    const generateReport = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            // Simulated report for demonstration
            const mockReport: ClinicalReport = {
                id: `RPT-${Date.now()}`,
                summary: "Patient presents with symptoms requiring clinical evaluation.",
                chiefComplaint: extractChiefComplaint(transcript),
                symptoms: extractSymptoms(transcript),
                vitals: vitals,
                clinicalImpression: "Clinical impression pending full transcript analysis via Gemini API.",
                recommendations: [
                    "Complete clinical evaluation recommended",
                    "Follow up with primary care provider",
                    "Continue monitoring vital signs",
                ],
                urgencyLevel: determineUrgency(vitals),
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
     * Verify report on blockchain (placeholder)
     */
    const verifyOnBlockchain = async () => {
        if (!report) return;

        setIsVerifying(true);

        try {
            // Simulate blockchain verification
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
            setReport({ ...report, verificationHash: mockHash });
        } catch (err) {
            setError("Failed to verify on blockchain. Please try again.");
            console.error("Verification error:", err);
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="trust-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#F4F4F6]">
                <h2 className="text-lg font-semibold text-gray-900">
                    Clinical Report Preview
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
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
                        <p className="text-gray-600 mb-6">
                            Ready to synthesize clinical report from intake data.
                        </p>
                        <button
                            onClick={generateReport}
                            disabled={isGenerating}
                            className="btn-secondary"
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
                            <span className="text-gray-500">Report ID: <code className="text-[#0055A4]">{report.id}</code></span>
                            <span className="text-gray-400">{report.generatedAt.toLocaleString()}</span>
                        </div>

                        {/* Urgency Badge */}
                        <div className="flex items-center gap-2">
                            <span className={`badge ${report.urgencyLevel === "emergent" ? "badge-error" :
                                    report.urgencyLevel === "urgent" ? "badge-warning" :
                                        "badge-success"
                                }`}>
                                {report.urgencyLevel.charAt(0).toUpperCase() + report.urgencyLevel.slice(1)} Priority
                            </span>
                        </div>

                        {/* Summary */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 mb-2">Summary</h3>
                            <p className="text-gray-700 bg-[#F4F4F6] rounded-lg p-4">{report.summary}</p>
                        </section>

                        {/* Chief Complaint */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 mb-2">Chief Complaint</h3>
                            <p className="text-gray-700">{report.chiefComplaint}</p>
                        </section>

                        {/* Symptoms */}
                        {report.symptoms.length > 0 && (
                            <section>
                                <h3 className="text-base font-semibold text-gray-900 mb-2">Reported Symptoms</h3>
                                <div className="flex flex-wrap gap-2">
                                    {report.symptoms.map((symptom, idx) => (
                                        <span key={idx} className="badge badge-info">{symptom}</span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Clinical Impression */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 mb-2">Clinical Impression</h3>
                            <p className="text-gray-700 bg-[#F4F4F6] rounded-lg p-4">{report.clinicalImpression}</p>
                        </section>

                        {/* Recommendations */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 mb-2">Recommendations</h3>
                            <ul className="list-disc list-inside text-gray-700 space-y-1">
                                {report.recommendations.map((rec, idx) => (
                                    <li key={idx}>{rec}</li>
                                ))}
                            </ul>
                        </section>

                        {/* Vitals Snapshot */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 mb-2">Vital Signs at Intake</h3>
                            <div className="grid grid-cols-4 gap-4 text-center">
                                <div className="bg-[#F4F4F6] rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Heart Rate</p>
                                    <p className="text-lg font-bold text-gray-900">{report.vitals.heartRate ?? "--"} bpm</p>
                                </div>
                                <div className="bg-[#F4F4F6] rounded-lg p-3">
                                    <p className="text-xs text-gray-500">SpO2</p>
                                    <p className="text-lg font-bold text-gray-900">{report.vitals.spO2 ?? "--"}%</p>
                                </div>
                                <div className="bg-[#F4F4F6] rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Resp Rate</p>
                                    <p className="text-lg font-bold text-gray-900">{report.vitals.respiratoryRate ?? "--"}/min</p>
                                </div>
                                <div className="bg-[#F4F4F6] rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Blood Pressure</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {report.vitals.bloodPressure
                                            ? `${report.vitals.bloodPressure.systolic}/${report.vitals.bloodPressure.diastolic}`
                                            : "--"
                                        }
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Blockchain Verification */}
                        <section className="border-t border-gray-200 pt-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-2">Blockchain Verification</h3>
                            {report.verificationHash ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-green-700 mb-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium">Verified on Blockchain</span>
                                    </div>
                                    <code className="text-xs text-gray-500 break-all">{report.verificationHash}</code>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={verifyOnBlockchain}
                                        disabled={isVerifying}
                                        className="btn-outline text-sm py-2 px-4"
                                    >
                                        {isVerifying ? "Verifying..." : "Verify with Kairo"}
                                    </button>
                                    <p className="text-xs text-gray-500">
                                        Register report hash on-chain for immutable verification
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Extract chief complaint from transcript
 */
function extractChiefComplaint(transcript: TranscriptEntry[]): string {
    // Find first patient response about symptoms
    const patientEntries = transcript.filter(e => e.speaker === "patient");
    if (patientEntries.length > 0) {
        return patientEntries[0].text.slice(0, 200) + (patientEntries[0].text.length > 200 ? "..." : "");
    }
    return "Symptoms as discussed during intake conversation.";
}

/**
 * Extract symptoms from transcript
 */
function extractSymptoms(transcript: TranscriptEntry[]): string[] {
    // Simplified symptom extraction
    const symptomKeywords = ["pain", "headache", "fever", "cough", "fatigue", "nausea", "dizzy", "chest"];
    const patientText = transcript
        .filter(e => e.speaker === "patient")
        .map(e => e.text.toLowerCase())
        .join(" ");

    return symptomKeywords.filter(keyword => patientText.includes(keyword));
}

/**
 * Determine urgency level based on vitals
 */
function determineUrgency(vitals: VitalsData): "routine" | "urgent" | "emergent" {
    if (vitals.heartRate && (vitals.heartRate > 120 || vitals.heartRate < 50)) return "emergent";
    if (vitals.spO2 && vitals.spO2 < 92) return "emergent";
    if (vitals.stressLevel && vitals.stressLevel > 80) return "urgent";
    return "routine";
}
