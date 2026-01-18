"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * @description Vital signs data structure from Presage rPPG
 */
export interface VitalsData {
    /** Heart rate in beats per minute */
    heartRate: number | null;
    /** Oxygen saturation percentage (SpO2) */
    spO2: number | null;
    /** Respiratory rate per minute */
    respiratoryRate: number | null;
    /** Blood pressure estimate (if available) */
    bloodPressure: {
        systolic: number;
        diastolic: number;
    } | null;
    /** Stress level indicator (0-100) */
    stressLevel: number | null;
    /** Heart rate variability in ms */
    hrv: number | null;
    /** Last update timestamp */
    lastUpdated: Date | null;
}

/**
 * @description Hook return type for useVitals
 */
interface UseVitalsReturn {
    /** Current vital signs data */
    vitals: VitalsData;
    /** Whether the camera is connected and streaming */
    isConnected: boolean;
    /** Whether vitals are currently being measured */
    isMeasuring: boolean;
    /** Any error that occurred */
    error: string | null;
    /** Connect to the camera and start measuring */
    connect: () => Promise<void>;
    /** Disconnect from the camera */
    disconnect: () => void;
    /** Reset vitals data */
    reset: () => void;
}

/**
 * @description Initial empty vitals state
 */
const INITIAL_VITALS: VitalsData = {
    heartRate: null,
    spO2: null,
    respiratoryRate: null,
    bloodPressure: null,
    stressLevel: null,
    hrv: null,
    lastUpdated: null,
};

/**
 * @description Custom hook to manage Presage rPPG vitals data stream
 * 
 * @setup
 * 1. Add your Presage API key to environment variables:
 *    NEXT_PUBLIC_PRESAGE_API_KEY=your_api_key
 * 
 * 2. Ensure your app is served over HTTPS (required for camera access)
 * 
 * 3. Review Presage SDK documentation:
 *    https://presagetech.com/docs
 * 
 * @example
 * ```tsx
 * function VitalsDisplay() {
 *   const { vitals, isConnected, connect, disconnect } = useVitals();
 *   
 *   return (
 *     <div>
 *       <p>Heart Rate: {vitals.heartRate ?? '--'} bpm</p>
 *       <button onClick={isConnected ? disconnect : connect}>
 *         {isConnected ? 'Stop' : 'Start'} Monitoring
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVitals(): UseVitalsReturn {
    const [vitals, setVitals] = useState<VitalsData>(INITIAL_VITALS);
    const [isConnected, setIsConnected] = useState(false);
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Connect to the camera and initialize Presage SDK
     */
    const connect = useCallback(async () => {
        try {
            setError(null);

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 },
                },
            });

            streamRef.current = stream;
            setIsConnected(true);
            setIsMeasuring(true);

            // TODO: Initialize actual Presage SDK
            // const presage = new PresageSDK({
            //   apiKey: process.env.NEXT_PUBLIC_PRESAGE_API_KEY,
            //   videoStream: stream,
            //   onVitalsUpdate: (data) => {
            //     setVitals({
            //       heartRate: data.heartRate,
            //       spO2: data.oxygenSaturation,
            //       respiratoryRate: data.respiratoryRate,
            //       bloodPressure: data.bloodPressure,
            //       stressLevel: data.stress,
            //       hrv: data.hrv,
            //       lastUpdated: new Date(),
            //     });
            //   },
            // });
            // await presage.start();

            // Simulated vitals for development
            intervalRef.current = setInterval(() => {
                setVitals({
                    heartRate: 60 + Math.floor(Math.random() * 30),
                    spO2: 95 + Math.floor(Math.random() * 5),
                    respiratoryRate: 12 + Math.floor(Math.random() * 8),
                    bloodPressure: {
                        systolic: 110 + Math.floor(Math.random() * 30),
                        diastolic: 70 + Math.floor(Math.random() * 15),
                    },
                    stressLevel: Math.floor(Math.random() * 100),
                    hrv: 30 + Math.floor(Math.random() * 40),
                    lastUpdated: new Date(),
                });
            }, 2000);

        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to connect camera";
            setError(message);
            console.error("Camera connection error:", err);
        }
    }, []);

    /**
     * Disconnect from the camera and stop measuring
     */
    const disconnect = useCallback(() => {
        // Stop the video stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        // Clear the simulation interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // TODO: Stop Presage SDK
        // presage.stop();

        setIsConnected(false);
        setIsMeasuring(false);
    }, []);

    /**
     * Reset vitals data to initial state
     */
    const reset = useCallback(() => {
        setVitals(INITIAL_VITALS);
        setError(null);
    }, []);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        vitals,
        isConnected,
        isMeasuring,
        error,
        connect,
        disconnect,
        reset,
    };
}

/**
 * @description Utility to check if vitals are within normal ranges
 * @param vitals - The vitals data to check
 * @returns Object indicating which vitals are abnormal
 */
export function checkVitalsAbnormalities(vitals: VitalsData): Record<string, boolean> {
    return {
        heartRateAbnormal: vitals.heartRate !== null && (vitals.heartRate < 60 || vitals.heartRate > 100),
        spO2Abnormal: vitals.spO2 !== null && vitals.spO2 < 95,
        respiratoryRateAbnormal: vitals.respiratoryRate !== null && (vitals.respiratoryRate < 12 || vitals.respiratoryRate > 20),
        bloodPressureAbnormal: vitals.bloodPressure !== null && (vitals.bloodPressure.systolic > 140 || vitals.bloodPressure.diastolic > 90),
    };
}
