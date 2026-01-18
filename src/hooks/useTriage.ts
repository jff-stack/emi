"use client";

import { useState, useCallback, useReducer } from "react";

/**
 * @description States in the triage conversation flow
 */
export type TriageState =
    | "idle"       // Not started
    | "greeting"   // Initial greeting
    | "symptoms"   // Gathering symptoms
    | "vitals"     // Collecting vital signs
    | "history"    // Medical history questions
    | "synthesis"  // Generating clinical summary
    | "complete";  // Intake complete

/**
 * @description A single entry in the conversation transcript
 */
export interface TranscriptEntry {
    /** Unique entry identifier */
    id: string;
    /** Who said this */
    speaker: "emi" | "patient";
    /** The text content */
    text: string;
    /** Timestamp of the entry */
    timestamp: Date;
    /** Associated triage state when this was said */
    state: TriageState;
}

/**
 * @description Actions for the triage state machine
 */
type TriageAction =
    | { type: "TRANSITION"; to: TriageState }
    | { type: "ADD_TRANSCRIPT"; entry: Omit<TranscriptEntry, "id" | "timestamp"> }
    | { type: "RESET" };

/**
 * @description Internal state for the reducer
 */
interface TriageInternalState {
    currentState: TriageState;
    transcript: TranscriptEntry[];
    stateHistory: TriageState[];
}

/**
 * @description Initial state for the triage reducer
 */
const initialState: TriageInternalState = {
    currentState: "idle",
    transcript: [],
    stateHistory: ["idle"],
};

/**
 * @description State machine valid transitions
 */
const VALID_TRANSITIONS: Record<TriageState, TriageState[]> = {
    idle: ["greeting"],
    greeting: ["symptoms"],
    symptoms: ["vitals", "history"],
    vitals: ["history", "symptoms"],
    history: ["synthesis", "symptoms", "vitals"],
    synthesis: ["complete"],
    complete: ["idle"], // Allow restart
};

/**
 * @description Reducer for triage state management
 */
function triageReducer(
    state: TriageInternalState,
    action: TriageAction
): TriageInternalState {
    switch (action.type) {
        case "TRANSITION": {
            const validNext = VALID_TRANSITIONS[state.currentState];
            if (!validNext.includes(action.to)) {
                console.warn(
                    `Invalid transition from ${state.currentState} to ${action.to}`
                );
                return state;
            }
            return {
                ...state,
                currentState: action.to,
                stateHistory: [...state.stateHistory, action.to],
            };
        }

        case "ADD_TRANSCRIPT": {
            const newEntry: TranscriptEntry = {
                ...action.entry,
                id: `transcript-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                timestamp: new Date(),
            };
            return {
                ...state,
                transcript: [...state.transcript, newEntry],
            };
        }

        case "RESET":
            return initialState;

        default:
            return state;
    }
}

/**
 * @description Hook return type for useTriage
 */
interface UseTriageReturn {
    /** Current triage state */
    state: TriageState;
    /** Conversation transcript */
    transcript: TranscriptEntry[];
    /** History of state transitions */
    stateHistory: TriageState[];
    /** Whether the intake is in progress */
    isActive: boolean;
    /** Whether the intake is complete */
    isComplete: boolean;
    /** Transition to a new state */
    transition: (to: TriageState) => void;
    /** Add an entry to the transcript */
    addTranscriptEntry: (speaker: "emi" | "patient", text: string) => void;
    /** Reset the triage session */
    reset: () => void;
    /** Get prompts for the current state */
    getCurrentPrompts: () => string[];
}

/**
 * @description Prompts/questions for each triage state
 */
const STATE_PROMPTS: Record<TriageState, string[]> = {
    idle: [],
    greeting: [
        "Hello, I'm Emi, your AI intake assistant.",
        "How are you feeling today?",
    ],
    symptoms: [
        "Can you describe your main symptoms?",
        "When did these symptoms start?",
        "How would you rate the severity from 1-10?",
        "Is there anything that makes it better or worse?",
    ],
    vitals: [
        "Let me capture your vital signs.",
        "Please ensure good lighting on your face.",
        "Try to remain still for accurate readings.",
    ],
    history: [
        "Do you have any chronic medical conditions?",
        "Are you currently taking any medications?",
        "Do you have any known allergies?",
        "Have you had any surgeries in the past?",
    ],
    synthesis: [
        "Thank you for providing that information.",
        "I'm now preparing a summary for your healthcare provider.",
    ],
    complete: [
        "Your intake is complete!",
        "A summary has been prepared for your healthcare provider.",
    ],
};

/**
 * @description Custom hook to manage the triage conversation state machine
 * 
 * @example
 * ```tsx
 * function IntakeFlow() {
 *   const { state, transcript, transition, addTranscriptEntry } = useTriage();
 *   
 *   const handleUserMessage = (text: string) => {
 *     addTranscriptEntry("patient", text);
 *     // Process response and potentially transition
 *   };
 *   
 *   return (
 *     <div>
 *       <p>Current state: {state}</p>
 *       {transcript.map((entry) => (
 *         <p key={entry.id}>{entry.speaker}: {entry.text}</p>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTriage(): UseTriageReturn {
    const [{ currentState, transcript, stateHistory }, dispatch] = useReducer(
        triageReducer,
        initialState
    );

    /**
     * Transition to a new state
     */
    const transition = useCallback((to: TriageState) => {
        dispatch({ type: "TRANSITION", to });
    }, []);

    /**
     * Add a new entry to the transcript
     */
    const addTranscriptEntry = useCallback(
        (speaker: "emi" | "patient", text: string) => {
            dispatch({
                type: "ADD_TRANSCRIPT",
                entry: { speaker, text, state: currentState },
            });
        },
        [currentState]
    );

    /**
     * Reset the entire triage session
     */
    const reset = useCallback(() => {
        dispatch({ type: "RESET" });
    }, []);

    /**
     * Get appropriate prompts for the current state
     */
    const getCurrentPrompts = useCallback(() => {
        return STATE_PROMPTS[currentState] || [];
    }, [currentState]);

    return {
        state: currentState,
        transcript,
        stateHistory,
        isActive: currentState !== "idle" && currentState !== "complete",
        isComplete: currentState === "complete",
        transition,
        addTranscriptEntry,
        reset,
        getCurrentPrompts,
    };
}

/**
 * @description Get a human-readable label for a triage state
 */
export function getStateLabel(state: TriageState): string {
    const labels: Record<TriageState, string> = {
        idle: "Ready",
        greeting: "Greeting",
        symptoms: "Gathering Symptoms",
        vitals: "Recording Vitals",
        history: "Medical History",
        synthesis: "Generating Summary",
        complete: "Complete",
    };
    return labels[state];
}

/**
 * @description Calculate progress percentage through the intake flow
 */
export function getProgressPercentage(state: TriageState): number {
    const progress: Record<TriageState, number> = {
        idle: 0,
        greeting: 10,
        symptoms: 30,
        vitals: 50,
        history: 70,
        synthesis: 90,
        complete: 100,
    };
    return progress[state];
}
