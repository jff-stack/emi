"use client";

import { useState } from "react";
import { VitalsData } from "@/hooks/useVitals";
import { TranscriptEntry } from "@/hooks/useTriage";
import { SOAPNote, generateClinicalReport, InsufficientDataError } from "@/lib/gemini";
import { submitReportToBlockchain } from "@/lib/blockchain";

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
    /** Optional image analysis results */
    imageAnalysis?: string;
}

/**
 * @description Extended report state including metadata
 */
interface ReportState {
    id: string;
    soapNote: SOAPNote;
    generatedAt: Date;
    verificationHash: string | null;
    blockNumber?: number;
}

/**
 * @description Final doctor's summary view component
 * Displays the synthesized clinical SOAP note from Gemini AI
 */
export function ReportPreview({ transcript, vitals, onClose, imageAnalysis }: ReportPreviewProps) {
    const [report, setReport] = useState<ReportState | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Generate clinical SOAP note using Gemini API
     */
    const generateReport = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            // Format transcript for Gemini
            const transcriptText = transcript
                .map((entry) => `${entry.speaker === "emi" ? "EMI" : "Patient"}: ${entry.text}`)
                .join("\n");

            // Call the Gemini API
            const soapNote = await generateClinicalReport(transcriptText, vitals, imageAnalysis);

            setReport({
                id: `RPT-${Date.now()}`,
                soapNote,
                generatedAt: new Date(),
                verificationHash: null,
            });
        } catch (err) {
            if (err instanceof InsufficientDataError) {
                setError("Not enough conversation data to generate a clinical report. Please continue the intake conversation.");
            } else {
                setError("Failed to generate clinical report. Please try again.");
                console.error("Report generation error:", err);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    /**
     * Verify report on blockchain
     */
    const verifyOnBlockchain = async () => {
        if (!report) return;

        setIsVerifying(true);

        try {
            const result = await submitReportToBlockchain(report.id, {
                soapNote: report.soapNote,
                vitals,
                timestamp: report.generatedAt.toISOString(),
            });

            if (result.success) {
                setReport({
                    ...report,
                    verificationHash: result.transactionHash,
                    blockNumber: result.blockNumber,
                });
            } else {
                throw new Error("Blockchain submission failed");
            }
        } catch (err) {
            setError("Failed to verify on blockchain. Please try again.");
            console.error("Verification error:", err);
        } finally {
            setIsVerifying(false);
        }
    };

    /**
     * Handle action button clicks
     */
    const handleActionClick = (action: string) => {
        // For demo purposes, show an alert. In production, these would route to appropriate pages
        const actionRoutes: Record<string, string> = {
            "Book Physical Therapy": "/book?service=physical_therapy",
            "Find Orthopedic Specialist": "/specialists?type=orthopedics",
            "Find Nearest ER": "https://maps.google.com/search/emergency+room+near+me",
            "Call 911 if Severe": "tel:911",
            "Schedule Pulmonology Consult": "/book?service=pulmonology",
            "Find Urgent Care": "https://maps.google.com/search/urgent+care+near+me",
            "Schedule Neurology Consult": "/book?service=neurology",
            "Track Headache Diary": "/health-diary",
            "Book Counseling Session": "/book?service=counseling",
            "Find Mental Health Resources": "/resources/mental-health",
            "Schedule Follow-up": "/book?service=follow_up",
            "Contact Support": "/support",
            "Book Lab Work": "/book?service=lab_work",
            "Crisis Hotline": "tel:988",
        };

        const route = actionRoutes[action];
        if (route) {
            if (route.startsWith("http") || route.startsWith("tel:")) {
                window.open(route, "_blank");
            } else {
                // In production, use router.push(route)
                alert(`Navigating to: ${route}`);
            }
        } else {
            alert(`Action: ${action}`);
        }
    };

    /**
     * Get priority badge styling
     */
    const getPriorityBadgeClass = (priority: SOAPNote["priority_label"]) => {
        switch (priority) {
            case "Emergency":
                return "bg-red-100 text-red-800 border-red-200";
            case "Urgent":
                return "bg-amber-100 text-amber-800 border-amber-200";
            case "Routine":
                return "bg-green-100 text-green-800 border-green-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <div className="trust-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#F4F4F6]">
                <h2 className="text-lg font-semibold text-gray-900">
                    Clinical SOAP Note
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
                            Ready to synthesize clinical SOAP note from intake data.
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
                                    Generating SOAP Note...
                                </span>
                            ) : (
                                "Generate SOAP Note with Gemini"
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

                        {/* Priority Badge & Triage Score */}
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityBadgeClass(report.soapNote.priority_label)}`}>
                                {report.soapNote.priority_label}
                            </span>
                            <span className="text-sm text-gray-500">
                                Triage Score: <span className="font-semibold">{report.soapNote.triage_score}/5</span>
                            </span>
                            {report.soapNote.suggested_specialist && (
                                <span className="text-sm text-[#0055A4]">
                                    Suggested: {report.soapNote.suggested_specialist}
                                </span>
                            )}
                        </div>

                        {/* Narrative Summary */}
                        <section className="bg-[#0055A4]/5 border-l-4 border-[#0055A4] rounded-r-lg p-4">
                            <h3 className="text-sm font-semibold text-[#0055A4] mb-1">Handoff Summary</h3>
                            <p className="text-gray-700">{report.soapNote.narrative_summary}</p>
                        </section>

                        {/* Risk Flags */}
                        {report.soapNote.risk_flags.length > 0 && (
                            <section>
                                <h3 className="text-base font-semibold text-gray-900 mb-2">Risk Flags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {report.soapNote.risk_flags.map((flag, idx) => (
                                        <span key={idx} className="px-2 py-1 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
                                            {flag}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* SOAP Note Sections */}
                        <div className="space-y-4">
                            {/* Subjective */}
                            <section>
                                <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">S</span>
                                    Subjective
                                </h3>
                                <div className="text-gray-700 bg-[#F4F4F6] rounded-lg p-4 whitespace-pre-wrap">
                                    {report.soapNote.subjective}
                                </div>
                            </section>

                            {/* Objective */}
                            <section>
                                <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">O</span>
                                    Objective
                                </h3>
                                <div className="text-gray-700 bg-[#F4F4F6] rounded-lg p-4 whitespace-pre-wrap">
                                    {report.soapNote.objective.text}
                                </div>
                            </section>

                            {/* Assessment */}
                            <section>
                                <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">A</span>
                                    Assessment
                                </h3>
                                <div className="text-gray-700 bg-[#F4F4F6] rounded-lg p-4 whitespace-pre-wrap">
                                    {report.soapNote.assessment}
                                </div>
                            </section>

                            {/* Plan */}
                            <section>
                                <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">P</span>
                                    Plan
                                </h3>
                                <ul className="list-none space-y-2">
                                    {report.soapNote.plan.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-gray-700 bg-[#F4F4F6] rounded-lg p-3">
                                            <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                                                {idx + 1}
                                            </span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>

                        {/* Vitals Snapshot */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 mb-2">Vital Signs at Intake</h3>
                            <div className="grid grid-cols-4 gap-4 text-center">
                                {/* Heart Rate */}
                                <div className="bg-[#F4F4F6] rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Heart Rate</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {vitals.heartRate?.toString() || report.soapNote.objective.data.heart_rate || "--"} bpm
                                    </p>
                                </div>

                                {/* SpO2 */}
                                <div className="bg-[#F4F4F6] rounded-lg p-3">
                                    <p className="text-xs text-gray-500">SpO2</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {vitals.spO2?.toString() || report.soapNote.objective.data.spo2 || "--"}%
                                    </p>
                                </div>

                                {/* Respiratory Rate */}
                                <div className="bg-[#F4F4F6] rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Resp Rate</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {vitals.respiratoryRate?.toString() || report.soapNote.objective.data.resp_rate || "--"}/min
                                    </p>
                                </div>

                                {/* Blood Pressure */}
                                <div className="bg-[#F4F4F6] rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Blood Pressure</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {vitals.bloodPressure
                                            ? `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`
                                            : report.soapNote.objective.data.bp || "--"
                                        } mmHg
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Action Buttons */}
                        {report.soapNote.action_buttons.length > 0 && (
                            <section>
                                <h3 className="text-base font-semibold text-gray-900 mb-3">Recommended Actions</h3>
                                <div className="flex flex-wrap gap-2">
                                    {report.soapNote.action_buttons.map((action, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleActionClick(action)}
                                            className="px-4 py-2 rounded-full text-sm font-medium bg-[#0055A4] text-white hover:bg-[#004080] transition-colors shadow-sm"
                                        >
                                            {action}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

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
                                        {report.blockNumber && (
                                            <span className="text-sm text-green-600">Block #{report.blockNumber}</span>
                                        )}
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
