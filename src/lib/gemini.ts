/**
 * @fileoverview Gemini API Clinical Synthesis Service
 * Converts patient transcript and vitals into professional SOAP notes
 *
 * @setup
 * Add your Gemini API key to environment variables:
 * GOOGLE_GEMINI_API_KEY=your_api_key
 *
 * @see https://ai.google.dev/
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { VitalsData } from "@/hooks/useVitals";

/**
 * @description SOAP Note output from Gemini
 */
export interface SOAPNote {
    /** Subjective - Patient's reported symptoms and history */
    subjective: string;
    /** Objective - Measurable clinical findings */
    objective: string;
    /** Assessment - Clinical interpretation and differential diagnoses */
    assessment: string;
    /** Plan - Recommended next steps */
    plan: string;
    /** Triage score (1-5, 1 = most urgent) */
    triage_score: number;
    /** Risk flags identified in the assessment */
    risk_flags: string[];
    /** Doctor-to-doctor handoff narrative summary */
    narrative_summary: string;
    /** Suggested specialist for referral based on presentation */
    suggested_specialist: string | null;
}

/**
 * @description Legacy clinical report format for backwards compatibility
 */
export interface ClinicalReport {
    summary: string;
    chiefComplaint: string;
    symptoms: string[];
    vitals: {
        heartRate: number | null;
        bloodPressure: { systolic: number; diastolic: number } | null;
        respiratoryRate: number | null;
        oxygenSaturation: number | null;
    };
    clinicalImpression: string;
    differentialDiagnoses: string[];
    recommendations: string[];
    triageLevel: "emergent" | "urgent" | "less-urgent" | "non-urgent";
    confidence: number;
    soapNote?: SOAPNote;
}

/**
 * @description Input data for clinical synthesis
 */
export interface ClinicalIntakeData {
    transcript: Array<{ speaker: string; text: string }>;
    vitals: VitalsData;
    demographics?: {
        age?: number;
        gender?: string;
    };
}

/**
 * System instruction for Gemini - Chain of Thought Clinical Reasoning
 */
const CMO_SYSTEM_INSTRUCTION = `You are an expert Chief Medical Officer performing a clinical intake synthesis. Your output will be read by the receiving physician, so write as if you are handing off a patient to a colleague.

## CHAIN OF THOUGHT ANALYSIS PROCESS

Before generating your final output, you MUST perform this internal analysis:

### STEP 1: SUBJECTIVE PAIN MARKERS
Identify direct quotes or paraphrased statements from the patient that indicate:
- Physical distress ("it hurts when...", "I can't...", "the pain is...")
- Emotional distress ("I'm scared", "I'm worried about...", "I've been anxious")
- Functional impairment ("I haven't been able to sleep", "I can't eat")
- Temporal patterns ("it started yesterday", "worse in the morning")

### STEP 2: VITALS CORRELATION
Cross-reference subjective reports with objective vital sign data:
- Does elevated HR correlate with reported anxiety or pain?
- Does SpO2 level match respiratory complaints?
- Are stress indicators aligning with emotional state described?
- Any vital sign anomalies that contradict or confirm patient statements?

### STEP 3: CLINICAL SYNTHESIS
Based on Steps 1-2, synthesize:
- Primary concern requiring immediate attention
- Secondary concerns for follow-up
- Appropriate specialist referral if needed

## OUTPUT REQUIREMENTS

Respond with valid JSON only. No markdown, no code blocks, no explanatory text.

{
  "subjective": "Clinical summary of patient's verbal report, incorporating direct quotes when impactful. Use medical terminology.",
  "objective": "Vital signs with clinical interpretation. Note correlations: 'HR 112 bpm consistent with reported anxiety state' or 'SpO2 97% reassuring despite dyspnea report.'",
  "assessment": "Your clinical impression based on the correlation analysis. State the most likely etiology first, followed by differentials to rule out.",
  "plan": "Specific actionable steps. Include: immediate interventions, diagnostic workup, specialist referral if needed, and patient education points.",
  "triage_score": 1-5,
  "risk_flags": ["Specific clinical red flags identified, e.g., 'Chest pain with exertion', 'Tachycardia at rest'"],
  "narrative_summary": "A 2-3 sentence doctor-to-doctor handoff. Start with 'Patient presents with...' Be concise, urgent, and medically precise. This should read like you're verbally handing off to the next physician.",
  "suggested_specialist": "Recommended specialist (e.g., 'Cardiology', 'Pulmonology', 'Psychiatry') or null if primary care appropriate"
}

## TRIAGE SCORING
1 = EMERGENT: Life-threatening, needs immediate intervention (chest pain + diaphoresis, acute SOB, altered mental status)
2 = URGENT: Serious, needs evaluation within 1-2 hours (severe pain, concerning vitals, high-risk presentation)
3 = LESS URGENT: Needs same-day evaluation (moderate symptoms, stable vitals, concerning history)
4 = NON-URGENT: Routine, can wait for scheduled appointment (minor complaints, stable, no red flags)
5 = ROUTINE: Wellness check, follow-up, minor administrative

## CRITICAL RULES
- NEVER diagnose. Use "concerning for", "consistent with", "suggestive of"
- If chest pain, SOB, or neurological symptoms: default to triage_score ≤2 unless compelling reason otherwise
- Always include at least one specific next step in plan
- narrative_summary is MANDATORY and must sound like a verbal handoff`;

/**
 * @description Generate a clinical SOAP note using Gemini AI
 * @param transcript - Raw conversation transcript
 * @param vitals - Patient vital signs data
 * @returns Promise resolving to SOAP note
 */
export async function generateClinicalReport(
    transcript: string,
    vitals: VitalsData
): Promise<SOAPNote> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
        console.warn("GOOGLE_GEMINI_API_KEY not configured. Using mock data.");
        return generateMockSOAPNote(transcript, vitals);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: CMO_SYSTEM_INSTRUCTION,
        });

        // Format vitals for the prompt
        const vitalsString = formatVitalsForPrompt(vitals);

        const prompt = `Analyze this patient intake and generate a SOAP note:

=== PATIENT TRANSCRIPT ===
${transcript || "No transcript available - patient did not provide verbal history."}

=== VITAL SIGNS ===
${vitalsString}

Generate a professional clinical SOAP note in JSON format.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse JSON from response (handle potential markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Invalid JSON response from Gemini");
        }

        const soapNote: SOAPNote = JSON.parse(jsonMatch[0]);

        // Validate required fields
        if (!soapNote.subjective || !soapNote.objective || !soapNote.assessment || !soapNote.plan) {
            throw new Error("Incomplete SOAP note from Gemini");
        }

        // Ensure triage_score is in valid range
        soapNote.triage_score = Math.max(1, Math.min(5, soapNote.triage_score || 4));

        // Ensure risk_flags is an array
        if (!Array.isArray(soapNote.risk_flags)) {
            soapNote.risk_flags = [];
        }

        // Ensure narrative_summary exists (critical for doctor handoff)
        if (!soapNote.narrative_summary) {
            soapNote.narrative_summary = `Patient presents with ${soapNote.risk_flags[0]?.toLowerCase() || 'chief complaint'} for evaluation. See SOAP note for details.`;
        }

        // Ensure suggested_specialist is null if not provided
        if (soapNote.suggested_specialist === undefined) {
            soapNote.suggested_specialist = null;
        }

        return soapNote;
    } catch (error) {
        console.error("Gemini API error:", error);
        console.warn("Falling back to mock SOAP note.");
        return generateMockSOAPNote(transcript, vitals);
    }
}

/**
 * @description Format vitals data for the Gemini prompt
 */
function formatVitalsForPrompt(vitals: VitalsData): string {
    const parts: string[] = [];

    if (vitals.heartRate !== null) {
        parts.push(`Heart Rate: ${vitals.heartRate} bpm`);
    }
    if (vitals.spO2 !== null) {
        parts.push(`SpO2: ${vitals.spO2}%`);
    }
    if (vitals.respiratoryRate !== null) {
        parts.push(`Respiratory Rate: ${vitals.respiratoryRate}/min`);
    }
    if (vitals.bloodPressure) {
        parts.push(`Blood Pressure: ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg`);
    }
    if (vitals.hrv !== null) {
        parts.push(`HRV: ${vitals.hrv} ms`);
    }
    if (vitals.stressLevel !== null) {
        parts.push(`Stress Level: ${vitals.stressLevel}%`);
    }

    return parts.length > 0 ? parts.join("\n") : "No vital signs data available.";
}

/**
 * @description Generate mock SOAP note for demo/fallback
 */
function generateMockSOAPNote(transcript: string, vitals: VitalsData): SOAPNote {
    const hasHighHR = vitals.heartRate !== null && vitals.heartRate > 100;
    const hasLowSpO2 = vitals.spO2 !== null && vitals.spO2 < 95;
    const hasHighStress = vitals.stressLevel !== null && vitals.stressLevel > 70;

    const riskFlags: string[] = [];
    if (hasHighHR) riskFlags.push("Elevated Heart Rate");
    if (hasLowSpO2) riskFlags.push("Low Oxygen Saturation");
    if (hasHighStress) riskFlags.push("High Stress Level");

    // Check transcript for concerning keywords
    const transcriptLower = transcript.toLowerCase();
    if (transcriptLower.includes("chest pain") || transcriptLower.includes("chest hurt")) {
        riskFlags.push("Chest Pain Reported");
    }
    if (transcriptLower.includes("dizzy") || transcriptLower.includes("lightheaded")) {
        riskFlags.push("Dizziness");
    }
    if (transcriptLower.includes("short of breath") || transcriptLower.includes("breathing")) {
        riskFlags.push("Dyspnea");
    }

    // Determine triage score based on findings
    let triageScore = 4;
    if (riskFlags.includes("Chest Pain Reported") || hasLowSpO2) {
        triageScore = 2;
    } else if (hasHighHR || riskFlags.length >= 2) {
        triageScore = 3;
    }

    // Determine suggested specialist based on symptoms
    let suggestedSpecialist: string | null = null;
    if (riskFlags.includes("Chest Pain Reported")) {
        suggestedSpecialist = "Cardiology";
    } else if (riskFlags.includes("Dyspnea") || hasLowSpO2) {
        suggestedSpecialist = "Pulmonology";
    } else if (hasHighStress) {
        suggestedSpecialist = "Psychiatry";
    }

    // Generate narrative summary
    const chiefComplaint = riskFlags[0] || "general intake";
    const urgencyText = triageScore <= 2 ? "requiring urgent evaluation" : triageScore === 3 ? "warranting prompt attention" : "for routine assessment";
    const narrativeSummary = `Patient presents with ${chiefComplaint.toLowerCase()} ${urgencyText}. ${hasHighHR ? "Tachycardia noted on vitals. " : ""}${hasLowSpO2 ? "Hypoxemia present. " : ""}Clinical correlation recommended.`;

    return {
        subjective: transcript
            ? `Patient presented for intake. ${transcript.slice(0, 200)}${transcript.length > 200 ? "..." : ""}`
            : "Patient completed intake interview. Chief complaint and history obtained via AI-assisted conversation.",
        objective: `Vitals obtained via contactless rPPG monitoring: ${vitals.heartRate ? `HR ${vitals.heartRate} bpm` : "HR not obtained"
            }, ${vitals.spO2 ? `SpO2 ${vitals.spO2}%` : "SpO2 not obtained"
            }, ${vitals.respiratoryRate ? `RR ${vitals.respiratoryRate}/min` : "RR not obtained"
            }${vitals.bloodPressure
                ? `, BP ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg`
                : ""
            }. ${hasHighHR ? "Tachycardia noted. " : ""}${hasLowSpO2 ? "Hypoxemia present. " : ""}`,
        assessment: riskFlags.length > 0
            ? `Clinical findings warrant further evaluation. Considerations include: ${riskFlags.join(", ")}. Full physician assessment recommended.`
            : "Patient appears stable on initial assessment. Routine evaluation appropriate.",
        plan: triageScore <= 2
            ? "Immediate physician evaluation recommended. Consider EKG, continuous monitoring, and focused physical exam."
            : triageScore === 3
                ? "Priority evaluation recommended. Schedule prompt physician review and targeted workup."
                : "Routine intake complete. Patient may proceed to standard care pathway.",
        triage_score: triageScore,
        risk_flags: riskFlags,
        narrative_summary: narrativeSummary,
        suggested_specialist: suggestedSpecialist,
    };
}

/**
 * @description Legacy function - synthesizes clinical report with SOAP note
 * @deprecated Use generateClinicalReport instead
 */
export async function synthesizeClinicalReport(
    intakeData: ClinicalIntakeData
): Promise<ClinicalReport> {
    // Format transcript for the new function
    const transcriptText = intakeData.transcript
        .map((t) => `${t.speaker}: ${t.text}`)
        .join("\n");

    // Generate SOAP note
    const soapNote = await generateClinicalReport(transcriptText, intakeData.vitals);

    // Map triage score to triage level
    const triageLevelMap: Record<number, ClinicalReport["triageLevel"]> = {
        1: "emergent",
        2: "urgent",
        3: "less-urgent",
        4: "non-urgent",
        5: "non-urgent",
    };

    // Convert to legacy format for backwards compatibility
    const report: ClinicalReport = {
        summary: soapNote.subjective,
        chiefComplaint: soapNote.risk_flags[0] || "General consultation",
        symptoms: soapNote.risk_flags,
        vitals: {
            heartRate: intakeData.vitals.heartRate,
            bloodPressure: intakeData.vitals.bloodPressure,
            respiratoryRate: intakeData.vitals.respiratoryRate,
            oxygenSaturation: intakeData.vitals.spO2,
        },
        clinicalImpression: soapNote.assessment,
        differentialDiagnoses: [soapNote.assessment],
        recommendations: [soapNote.plan],
        triageLevel: triageLevelMap[soapNote.triage_score] || "non-urgent",
        confidence: soapNote.triage_score <= 2 ? 0.9 : 0.75,
        soapNote,
    };

    return report;
}

/**
 * @description Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
    return !!(process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY);
}
