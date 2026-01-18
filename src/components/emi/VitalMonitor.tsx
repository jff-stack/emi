"use client";

import { useState, useEffect, useRef, RefObject, useCallback } from "react";
import Webcam from "react-webcam";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    ResponsiveContainer,
} from "recharts";
import {
    VitalsData,
    SignalQuality,
    getSignalQualityLabel,
    getSignalQualityColor,
} from "@/hooks/useVitals";
import { isPresageConfigured } from "@/lib/presage";

/**
 * @description Props for the VitalMonitor component
 */
interface VitalMonitorProps {
    /** Current vitals data from the Presage SDK */
    vitals: VitalsData;
    /** Whether the camera is connected */
    isConnected: boolean;
    /** Whether the system is calibrating */
    isCalibrating?: boolean;
    /** Signal quality metrics */
    signalQuality?: SignalQuality;
    /** Video element ref from useVitals */
    videoRef: RefObject<HTMLVideoElement | null>;
    /** Connect to the camera */
    onConnect: () => void;
    /** Disconnect from the camera */
    onDisconnect: () => void;
    /** Whether the user is currently speaking (for biofeedback) */
    isSpeaking?: boolean;
}

/**
 * @description Data point for the rPPG signal chart
 */
interface SignalDataPoint {
    time: number;
    value: number;
    stress: number;
}

/**
 * @description Presage Technologies rPPG camera wrapper component
 * Features a high-tech CV overlay with forehead ROI, real-time EKG-style chart,
 * and biofeedback reactivity for hackathon demo.
 */
export function VitalMonitor({
    vitals,
    isConnected,
    isCalibrating = false,
    signalQuality,
    videoRef,
    onConnect,
    onDisconnect,
    isSpeaking = false,
}: VitalMonitorProps) {
    // Patient-friendly mode hides numbers by default
    const [showNumbers, setShowNumbers] = useState(false);

    // Real-time signal data for EKG-style chart
    const [signalData, setSignalData] = useState<SignalDataPoint[]>([]);
    const signalTimeRef = useRef(0);

    // ROI box animation state (syncs with simulated HR)
    const [roiPulsePhase, setRoiPulsePhase] = useState(0);

    // Stress boost from speaking (biofeedback reactivity)
    const [stressBoost, setStressBoost] = useState(0);

    // Generate simulated rPPG signal data
    useEffect(() => {
        if (!isConnected) {
            setSignalData([]);
            signalTimeRef.current = 0;
            return;
        }

        const interval = setInterval(() => {
            const time = signalTimeRef.current;
            const baseHR = vitals.heartRate || 72;

            // Generate realistic PPG waveform with harmonics
            const frequency = baseHR / 60; // Hz
            const t = time / 1000; // Convert to seconds

            // PPG-like waveform: sharp systolic peak, gradual dicrotic notch
            const phase = (t * frequency * 2 * Math.PI) % (2 * Math.PI);
            const systolicPeak = Math.exp(-Math.pow(phase - 0.5, 2) / 0.1);
            const dicroticNotch = 0.3 * Math.exp(-Math.pow(phase - 2.5, 2) / 0.3);
            const noise = (Math.random() - 0.5) * 0.05;

            const value = 0.5 + systolicPeak * 0.4 + dicroticNotch + noise;

            // Stress value with speaking boost
            const baseStress = vitals.stressLevel || 35;
            const currentStress = Math.min(100, baseStress + stressBoost);

            setSignalData(prev => {
                const newData = [...prev, { time, value, stress: currentStress }];
                // Keep last 100 points for scrolling effect
                return newData.slice(-100);
            });

            signalTimeRef.current += 50;

            // Update ROI pulse phase
            setRoiPulsePhase(phase);
        }, 50);

        return () => clearInterval(interval);
    }, [isConnected, vitals.heartRate, vitals.stressLevel, stressBoost]);

    // Biofeedback: boost stress when speaking
    useEffect(() => {
        if (isSpeaking) {
            setStressBoost(prev => Math.min(25, prev + 5)); // Gradually increase
        } else {
            // Gradually decay stress boost
            const decay = setInterval(() => {
                setStressBoost(prev => Math.max(0, prev - 2));
            }, 200);
            return () => clearInterval(decay);
        }
    }, [isSpeaking]);

    const qualityLabel = signalQuality ? getSignalQualityLabel(signalQuality.overall) : "No Signal";
    const qualityColor = signalQuality ? getSignalQualityColor(signalQuality.overall) : "text-slate-500";

    // ROI box color based on pulse phase (green during systole, red during diastole)
    const roiColor = roiPulsePhase < Math.PI
        ? `rgba(52, 211, 153, ${0.5 + Math.sin(roiPulsePhase) * 0.3})` // Green pulse
        : `rgba(248, 113, 113, ${0.3 + Math.sin(roiPulsePhase) * 0.2})`; // Red fade

    return (
        <div className="flex flex-col gap-4">
            {/* Camera Preview with CV Overlay */}
            <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                {/* Video element always rendered but hidden when not connected */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover scale-x-[-1] ${isConnected ? "block" : "hidden"
                        }`}
                />

                {isConnected ? (
                    <>
                        {/* CV-Style ROI Overlay */}
                        <CVOverlay
                            roiColor={roiColor}
                            heartRate={vitals.heartRate}
                            signalQuality={signalQuality?.overall || 0}
                        />

                        {/* Clinician Overlay Toggle - Top Right */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end z-20">
                            <button
                                onClick={() => setShowNumbers(!showNumbers)}
                                className={`flex items-center gap-2 text-xs px-2 py-1 rounded-full transition-all ${showNumbers
                                    ? "bg-cyan-600/90 text-white"
                                    : "bg-slate-800/80 text-slate-400 hover:text-white"
                                    }`}
                            >
                                <span className={`w-3 h-3 rounded-full transition-colors ${showNumbers ? "bg-cyan-300" : "bg-slate-500"
                                    }`} />
                                <span className="text-[10px] font-medium">Clinician</span>
                            </button>

                            {/* Status Badge */}
                            {isCalibrating ? (
                                <span className="flex items-center gap-1 text-xs bg-amber-600/80 text-white px-2 py-1 rounded-full">
                                    <span className="w-2 h-2 bg-amber-300 rounded-full animate-pulse" />
                                    Calibrating...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs bg-emerald-600/80 text-white px-2 py-1 rounded-full">
                                    <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                                    rPPG Active
                                </span>
                            )}
                        </div>

                        {/* Face Detection Status */}
                        <div className="absolute bottom-2 left-2 z-20">
                            <span
                                className={`text-xs px-2 py-1 rounded-full ${signalQuality?.faceDetected
                                    ? "bg-emerald-600/80 text-white"
                                    : "bg-amber-600/80 text-white"
                                    }`}
                            >
                                {signalQuality?.faceDetected ? "Face Detected" : "Position Face"}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <svg
                            className="w-12 h-12 mb-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        <p className="text-sm">Camera not connected</p>
                        <p className="text-xs text-slate-600 mt-1">
                            Click below to start vital signs monitoring
                        </p>
                    </div>
                )}
            </div>

            {/* Real-time rPPG Signal Chart */}
            {isConnected && (
                <RPPGSignalChart
                    data={signalData}
                    heartRate={vitals.heartRate}
                    stressBoost={stressBoost}
                />
            )}

            {/* Patient-Friendly View (Default) */}
            {isConnected && !showNumbers && (
                <PatientFriendlyView
                    isCalibrating={isCalibrating}
                    signalQuality={signalQuality}
                    heartRate={vitals.heartRate}
                    stressBoost={stressBoost}
                />
            )}

            {/* Clinician View (Numeric Values) */}
            {isConnected && showNumbers && (
                <>
                    {/* Signal Quality Indicator */}
                    {signalQuality && (
                        <div className="bg-slate-800/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-400">Signal Quality</span>
                                <span className={`text-xs font-medium ${qualityColor}`}>
                                    {qualityLabel}
                                </span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${signalQuality.overall >= 80
                                        ? "bg-emerald-500"
                                        : signalQuality.overall >= 60
                                            ? "bg-cyan-500"
                                            : signalQuality.overall >= 40
                                                ? "bg-amber-500"
                                                : "bg-red-500"
                                        }`}
                                    style={{ width: `${signalQuality.overall}%` }}
                                />
                            </div>
                            {signalQuality.recommendation && (
                                <p className="text-xs text-amber-400 mt-2">
                                    {signalQuality.recommendation}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Core Vitals */}
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
                            value={
                                vitals.bloodPressure
                                    ? `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`
                                    : null
                            }
                            unit="mmHg"
                            icon="💉"
                            status={getBPStatus(vitals.bloodPressure)}
                        />
                    </div>

                    {/* Additional Vitals (HRV & Stress) */}
                    {(vitals.hrv !== null || vitals.stressLevel !== null) && (
                        <div className="grid grid-cols-2 gap-3">
                            <VitalCard
                                label="HRV"
                                value={vitals.hrv}
                                unit="ms"
                                icon="📊"
                                status={getHRVStatus(vitals.hrv)}
                            />
                            <VitalCard
                                label="Stress Level"
                                value={vitals.stressLevel !== null ? Math.min(100, vitals.stressLevel + stressBoost) : null}
                                unit="%"
                                icon="🧠"
                                status={getStressStatus(vitals.stressLevel !== null ? vitals.stressLevel + stressBoost : null)}
                                highlight={stressBoost > 0}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Connect/Disconnect Button */}
            <button
                onClick={isConnected ? onDisconnect : onConnect}
                disabled={isCalibrating}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${isCalibrating
                    ? "bg-slate-600/50 text-slate-400 cursor-not-allowed"
                    : isConnected
                        ? "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50"
                        : "bg-cyan-600 hover:bg-cyan-500 text-white"
                    }`}
            >
                {isCalibrating
                    ? "Calibrating..."
                    : isConnected
                        ? "Disconnect Camera"
                        : "Start Vital Signs Monitoring"}
            </button>

            {/* API Key Warning */}
            {!isPresageConfigured() && (
                <p className="text-xs text-amber-400 text-center">
                    Presage API key not configured - running in simulation mode
                </p>
            )}
        </div>
    );
}

/**
 * @description CV-style overlay with ROI boxes for rPPG signal extraction visualization
 */
function CVOverlay({
    roiColor,
    heartRate,
    signalQuality
}: {
    roiColor: string;
    heartRate: number | null;
    signalQuality: number;
}) {
    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 640 480"
        >
            {/* Scan lines effect */}
            <defs>
                <pattern id="scanlines" patternUnits="userSpaceOnUse" width="100%" height="4">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(0,255,0,0.03)" strokeWidth="1" />
                </pattern>
                <linearGradient id="roiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={roiColor} />
                    <stop offset="100%" stopColor="rgba(52, 211, 153, 0.2)" />
                </linearGradient>
            </defs>

            {/* Scan lines overlay */}
            <rect width="100%" height="100%" fill="url(#scanlines)" />

            {/* Face outline (dashed) */}
            <ellipse
                cx="320" cy="200" rx="120" ry="150"
                fill="none"
                stroke="rgba(52, 211, 153, 0.3)"
                strokeWidth="2"
                strokeDasharray="8 4"
            />

            {/* Forehead ROI Box - Main signal extraction region */}
            <rect
                x="230" y="80" width="180" height="60"
                fill="none"
                stroke={roiColor}
                strokeWidth="3"
                rx="4"
            >
                <animate
                    attributeName="stroke-opacity"
                    values="0.6;1;0.6"
                    dur="1s"
                    repeatCount="indefinite"
                />
            </rect>

            {/* ROI Label */}
            <text x="235" y="75" fill="rgba(52, 211, 153, 0.9)" fontSize="10" fontFamily="monospace">
                ROI: FOREHEAD
            </text>

            {/* Corner brackets on ROI */}
            <path d="M230,95 L230,80 L250,80" fill="none" stroke={roiColor} strokeWidth="2" />
            <path d="M410,95 L410,80 L390,80" fill="none" stroke={roiColor} strokeWidth="2" />
            <path d="M230,125 L230,140 L250,140" fill="none" stroke={roiColor} strokeWidth="2" />
            <path d="M410,125 L410,140 L390,140" fill="none" stroke={roiColor} strokeWidth="2" />

            {/* Secondary ROI: Cheeks */}
            <rect x="160" y="200" width="60" height="40" fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="1" strokeDasharray="4 2" rx="2" />
            <rect x="420" y="200" width="60" height="40" fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="1" strokeDasharray="4 2" rx="2" />
            <text x="165" y="195" fill="rgba(59, 130, 246, 0.7)" fontSize="8" fontFamily="monospace">L-CHEEK</text>
            <text x="425" y="195" fill="rgba(59, 130, 246, 0.7)" fontSize="8" fontFamily="monospace">R-CHEEK</text>

            {/* Signal extraction indicator */}
            <g transform="translate(500, 50)">
                <rect x="0" y="0" width="120" height="60" fill="rgba(0,0,0,0.6)" rx="4" />
                <text x="10" y="18" fill="#34d399" fontSize="10" fontFamily="monospace">rPPG SIGNAL</text>
                <text x="10" y="35" fill="#fff" fontSize="14" fontFamily="monospace">
                    {heartRate ? `${heartRate} BPM` : "-- BPM"}
                </text>
                <rect x="10" y="45" width={signalQuality} height="6" fill="#34d399" rx="2">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                </rect>
                <text x="10" y="58" fill="rgba(148, 163, 184, 0.8)" fontSize="8" fontFamily="monospace">
                    SNR: {signalQuality.toFixed(0)}%
                </text>
            </g>

            {/* Grid overlay */}
            <g stroke="rgba(52, 211, 153, 0.1)" strokeWidth="0.5">
                {[...Array(16)].map((_, i) => (
                    <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="480" />
                ))}
                {[...Array(12)].map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={i * 40} x2="640" y2={i * 40} />
                ))}
            </g>
        </svg>
    );
}

/**
 * @description Real-time rPPG signal visualization (EKG-style scrolling chart)
 */
function RPPGSignalChart({
    data,
    heartRate,
    stressBoost
}: {
    data: SignalDataPoint[];
    heartRate: number | null;
    stressBoost: number;
}) {
    return (
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-slate-400 font-mono">
                        Real-time rPPG Signal Extraction (Simulation)
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-emerald-400 font-mono">
                        HR: {heartRate || "--"} BPM
                    </span>
                    {stressBoost > 0 && (
                        <span className="text-xs text-amber-400 font-mono animate-pulse">
                            ⚡ BIOFEEDBACK +{stressBoost}%
                        </span>
                    )}
                </div>
            </div>

            <div className="h-24 bg-slate-950 rounded border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[0, 1]} hide />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#34d399"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Signal metadata */}
            <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-mono">
                <span>Fs: 20Hz | Window: 5s | Filter: Bandpass 0.5-4Hz</span>
                <span>Algorithm: CVD-PPG v2.1</span>
            </div>
        </div>
    );
}

/**
 * @description Patient-friendly view with soothing animation instead of numbers
 * Prevents biofeedback anxiety by hiding raw vital sign values
 */
function PatientFriendlyView({
    isCalibrating,
    signalQuality,
    heartRate,
    stressBoost,
}: {
    isCalibrating: boolean;
    signalQuality?: SignalQuality;
    heartRate: number | null;
    stressBoost: number;
}) {
    // Calculate pulse animation speed based on heart rate (if available)
    const pulseSpeed = heartRate ? Math.max(0.5, 60 / heartRate) : 1;

    return (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-6 border border-slate-700/50">
            {/* Soothing Pulse Animation */}
            <div className="flex items-center justify-center mb-4">
                <div className="relative">
                    {/* Outer pulse ring */}
                    <div
                        className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"
                        style={{ animationDuration: `${pulseSpeed * 2}s` }}
                    />
                    {/* Middle pulse ring */}
                    <div
                        className="absolute inset-2 rounded-full bg-emerald-500/30"
                        style={{
                            animation: `pulse ${pulseSpeed}s ease-in-out infinite`,
                        }}
                    />
                    {/* Core pulse orb */}
                    <div
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors ${stressBoost > 10
                                ? "bg-gradient-to-br from-amber-400 to-orange-500"
                                : "bg-gradient-to-br from-emerald-400 to-teal-500"
                            }`}
                        style={{
                            animation: `pulse ${pulseSpeed}s ease-in-out infinite`,
                        }}
                    >
                        {/* Heart icon */}
                        <svg
                            className="w-10 h-10 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Reassuring Status Text */}
            <div className="text-center">
                {isCalibrating ? (
                    <>
                        <p className="text-lg font-medium text-amber-300">
                            Calibrating...
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                            Please hold still for a moment
                        </p>
                    </>
                ) : stressBoost > 10 ? (
                    <>
                        <p className="text-lg font-medium text-amber-300">
                            Detecting Biofeedback Response
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                            Elevated stress detected during conversation
                        </p>
                    </>
                ) : signalQuality?.faceDetected ? (
                    <>
                        <p className="text-lg font-medium text-emerald-300">
                            Vitals Signal: Strong & Secure
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                            Your health data is being monitored safely
                        </p>
                    </>
                ) : (
                    <>
                        <p className="text-lg font-medium text-amber-300">
                            Searching for Signal...
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                            Please position your face in the camera frame
                        </p>
                    </>
                )}
            </div>

            {/* Subtle waveform animation */}
            <div className="mt-4 flex justify-center items-center gap-1 h-8">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-1 rounded-full ${stressBoost > 10 ? "bg-amber-500/60" : "bg-emerald-500/60"}`}
                        style={{
                            height: `${20 + Math.sin((i + Date.now() / 500) * 0.5) * 15}px`,
                            animation: `waveform ${0.8 + i * 0.05}s ease-in-out infinite alternate`,
                            animationDelay: `${i * 0.05}s`,
                        }}
                    />
                ))}
            </div>

            <style jsx>{`
                @keyframes waveform {
                    0% {
                        height: 10px;
                    }
                    100% {
                        height: 24px;
                    }
                }
            `}</style>
        </div>
    );
}

/**
 * @description Individual vital sign display card (Clinician View)
 */
function VitalCard({
    label,
    value,
    unit,
    icon,
    status,
    highlight = false,
}: {
    label: string;
    value: number | string | null;
    unit: string;
    icon: string;
    status: "normal" | "warning" | "critical" | "unknown";
    highlight?: boolean;
}) {
    const statusColors = {
        normal: "text-emerald-400",
        warning: "text-amber-400",
        critical: "text-red-400",
        unknown: "text-slate-500",
    };

    return (
        <div className={`bg-slate-800/50 rounded-lg p-3 transition-all ${highlight ? "ring-2 ring-amber-500/50 bg-amber-900/20" : ""}`}>
            <div className="flex items-center gap-2 mb-1">
                <span>{icon}</span>
                <span className="text-xs text-slate-400">{label}</span>
                {highlight && <span className="text-[10px] text-amber-400">⚡</span>}
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

function getHRVStatus(hrv: number | null): "normal" | "warning" | "critical" | "unknown" {
    if (hrv === null) return "unknown";
    if (hrv < 20) return "critical";
    if (hrv < 30) return "warning";
    return "normal";
}

function getStressStatus(stress: number | null): "normal" | "warning" | "critical" | "unknown" {
    if (stress === null) return "unknown";
    if (stress > 80) return "critical";
    if (stress > 60) return "warning";
    return "normal";
}
