"use client";

import { useRef, useEffect, useState } from "react";
import { VitalsData } from "@/hooks/useVitals";

/**
 * @description Props for the VitalMonitor component
 */
interface VitalMonitorProps {
    /** Current vitals data from the Presage SDK */
    vitals: VitalsData;
    /** Whether the camera is connected */
    isConnected: boolean;
    /** Connect to the camera */
    onConnect: () => void;
    /** Disconnect from the camera */
    onDisconnect: () => void;
}

/**
 * @description Presage Technologies rPPG camera wrapper component
 * Displays real-time vital signs captured via facial video analysis
 * 
 * @setup
 * 1. Add your Presage API credentials to environment variables:
 *    NEXT_PUBLIC_PRESAGE_API_KEY=your_api_key
 * 
 * 2. Ensure HTTPS is enabled (required for camera access)
 * 
 * 3. Review Presage documentation for SDK integration:
 *    https://presagetech.com/docs
 * 
 * @example
 * ```tsx
 * const { vitals, isConnected, connect, disconnect } = useVitals();
 * <VitalMonitor 
 *   vitals={vitals}
 *   isConnected={isConnected}
 *   onConnect={connect}
 *   onDisconnect={disconnect}
 * />
 * ```
 */
export function VitalMonitor({ vitals, isConnected, onConnect, onDisconnect }: VitalMonitorProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    /**
     * Initialize camera stream when connected
     */
    useEffect(() => {
        if (!isConnected || !videoRef.current) return;

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: 320, height: 240 },
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setCameraError(null);
            } catch (error) {
                console.error("Camera access denied:", error);
                setCameraError("Camera access denied. Please enable camera permissions.");
            }
        };

        startCamera();

        return () => {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isConnected]);

    return (
        <div className="flex flex-col gap-4">
            {/* Camera Preview */}
            <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden">
                {isConnected ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        {/* Overlay with face detection indicator */}
                        <div className="absolute inset-0 border-2 border-dashed border-cyan-400/50 m-4 rounded-lg" />
                        <div className="absolute top-2 right-2">
                            <span className="flex items-center gap-1 text-xs bg-emerald-600/80 text-white px-2 py-1 rounded-full">
                                <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                                Live
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Camera not connected</p>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {cameraError && (
                <p className="text-xs text-red-400 text-center">{cameraError}</p>
            )}

            {/* Vitals Display */}
            <div className="grid grid-cols-2 gap-3">
                <VitalCard
                    label="Heart Rate"
                    value={vitals.heartRate}
                    unit="bpm"
                    icon="❤️"
                    status={getHeartRateStatus(vitals.heartRate)}
                />
                <VitalCard
                    label="SpO2"
                    value={vitals.spO2}
                    unit="%"
                    icon="💨"
                    status={getSpO2Status(vitals.spO2)}
                />
                <VitalCard
                    label="Resp Rate"
                    value={vitals.respiratoryRate}
                    unit="/min"
                    icon="🫁"
                    status={getRespiratoryStatus(vitals.respiratoryRate)}
                />
                <VitalCard
                    label="Blood Pressure"
                    value={vitals.bloodPressure ? `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}` : null}
                    unit="mmHg"
                    icon="💉"
                    status={getBPStatus(vitals.bloodPressure)}
                />
            </div>

            {/* Connect/Disconnect Button */}
            <button
                onClick={isConnected ? onDisconnect : onConnect}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${isConnected
                        ? "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50"
                        : "bg-cyan-600 hover:bg-cyan-500 text-white"
                    }`}
            >
                {isConnected ? "Disconnect Camera" : "Connect Camera"}
            </button>

            {/* API Key Warning */}
            {!process.env.NEXT_PUBLIC_PRESAGE_API_KEY && (
                <p className="text-xs text-amber-400 text-center">
                    ⚠️ Presage API key not configured. Add NEXT_PUBLIC_PRESAGE_API_KEY to your environment.
                </p>
            )}
        </div>
    );
}

/**
 * @description Individual vital sign display card
 */
function VitalCard({
    label,
    value,
    unit,
    icon,
    status
}: {
    label: string;
    value: number | string | null;
    unit: string;
    icon: string;
    status: "normal" | "warning" | "critical" | "unknown";
}) {
    const statusColors = {
        normal: "text-emerald-400",
        warning: "text-amber-400",
        critical: "text-red-400",
        unknown: "text-slate-500",
    };

    return (
        <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
                <span>{icon}</span>
                <span className="text-xs text-slate-400">{label}</span>
            </div>
            <p className={`text-xl font-bold ${statusColors[status]}`}>
                {value !== null ? value : "--"}
                <span className="text-xs font-normal text-slate-500 ml-1">{unit}</span>
            </p>
        </div>
    );
}

// Status calculation helpers
function getHeartRateStatus(hr: number | null): "normal" | "warning" | "critical" | "unknown" {
    if (hr === null) return "unknown";
    if (hr < 50 || hr > 120) return "critical";
    if (hr < 60 || hr > 100) return "warning";
    return "normal";
}

function getSpO2Status(spo2: number | null): "normal" | "warning" | "critical" | "unknown" {
    if (spo2 === null) return "unknown";
    if (spo2 < 90) return "critical";
    if (spo2 < 95) return "warning";
    return "normal";
}

function getRespiratoryStatus(rr: number | null): "normal" | "warning" | "critical" | "unknown" {
    if (rr === null) return "unknown";
    if (rr < 8 || rr > 25) return "critical";
    if (rr < 12 || rr > 20) return "warning";
    return "normal";
}

function getBPStatus(bp: { systolic: number; diastolic: number } | null): "normal" | "warning" | "critical" | "unknown" {
    if (bp === null) return "unknown";
    if (bp.systolic > 180 || bp.diastolic > 120) return "critical";
    if (bp.systolic > 140 || bp.diastolic > 90) return "warning";
    return "normal";
}
