"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VoiceInterface } from "@/components/emi/VoiceInterface";
import { VitalMonitor } from "@/components/emi/VitalMonitor";
import { useVitals } from "@/hooks/useVitals";
import { 
  Shield, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  User,
  Calendar,
  Phone,
  Mail,
  Activity,
  FileText,
  Lock,
  Clock
} from "lucide-react";
import { TranscriptMessage } from "@/lib/elevenlabs";
import { synthesizeClinicalReport, ClinicalReport } from "@/lib/gemini";
import { submitReportToBlockchain, hashReport } from "@/lib/blockchain";

/**
 * @title Adaptive Pre-Screening Bridge
 * @description The interface that transitions users from booking to Live Triage
 * 
 * Flow:
 * 1. Basic patient info collection
 * 2. Voice triage with Emi (ElevenLabs)
 * 3. Contactless vitals monitoring (Presage)
 * 4. Clinical synthesis (Gemini)
 * 5. Blockchain verification (Kairo)
 */

enum IntakePhase {
  PATIENT_INFO = "patient_info",
  APPOINTMENT = "appointment",
  TRIAGE = "triage",
  SYNTHESIS = "synthesis",
  VERIFICATION = "verification",
  COMPLETE = "complete"
}

interface PatientInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
}

export default function SchedulingPage() {
  const router = useRouter();
  
  // Phase management
  const [phase, setPhase] = useState<IntakePhase>(IntakePhase.PATIENT_INFO);
  
  // Patient information
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phone: "",
    email: ""
  });

  // Appointment details
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [appointmentTime, setAppointmentTime] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<string>("general");

  // Triage session data
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [clinicalReport, setClinicalReport] = useState<ClinicalReport | null>(null);
  
  // Blockchain verification
  const [reportHash, setReportHash] = useState<string>("");
  const [blockchainTxHash, setBlockchainTxHash] = useState<string>("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vitals monitoring hook
  const { 
    vitals, 
    isConnected: vitalsConnected, 
    isCalibrating, 
    signalQuality, 
    videoRef, 
    connect: connectVitals, 
    disconnect: disconnectVitals 
  } = useVitals();

  // Generate session ID on mount
  useEffect(() => {
    const id = `intake_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    setSessionId(id);
  }, []);

  /**
   * Validate patient info and advance to appointment booking
   */
  const handleStartTriage = useCallback(() => {
    // Validation
    if (!patientInfo.firstName || !patientInfo.lastName || !patientInfo.dateOfBirth) {
      setError("Please fill in all required fields");
      return;
    }

    setError(null);
    setPhase(IntakePhase.APPOINTMENT);
  }, [patientInfo]);

  /**
   * Confirm appointment and start triage
   */
  const handleConfirmAppointment = useCallback(() => {
    // Validation
    if (!appointmentDate || !appointmentTime) {
      setError("Please select an appointment date and time");
      return;
    }

    setError(null);
    setPhase(IntakePhase.TRIAGE);
    
    // Start vitals monitoring
    setTimeout(() => {
      connectVitals();
    }, 1000);
  }, [appointmentDate, appointmentTime, connectVitals]);

  /**
   * Handle transcript updates from voice interface
   */
  const handleTranscriptUpdate = useCallback((messages: TranscriptMessage[]) => {
    setTranscript(messages);
  }, []);

  /**
   * Handle conversation end and synthesize report
   */
  const handleConversationEnd = useCallback(async (
    finalTranscript: TranscriptMessage[], 
    conversationId: string
  ) => {
    console.log("[Intake] Conversation ended, synthesizing report...");
    setPhase(IntakePhase.SYNTHESIS);
    setIsProcessing(true);

    try {
      // Convert transcript format to match TranscriptEntry interface
      const transcriptEntries = finalTranscript.map((msg, idx) => ({
        id: `transcript-${Date.now()}-${idx}`,
        speaker: (msg.role === "user" ? "patient" : "emi") as "patient" | "emi",
        text: msg.text,
        timestamp: msg.timestamp,
        state: "symptoms" as const
      }));

      // Synthesize clinical report with Gemini
      const report = await synthesizeClinicalReport({
        transcript: transcriptEntries,
        vitals: vitals,
        demographics: {
          age: calculateAge(patientInfo.dateOfBirth),
          // Add more demographics as needed
        }
      });

      setClinicalReport(report);
      
      // Generate SHA-256 hash for blockchain
      const hash = hashReport({
        sessionId,
        patientInfo,
        report,
        vitals,
        timestamp: new Date().toISOString()
      });
      
      setReportHash(hash);
      setPhase(IntakePhase.VERIFICATION);
      
    } catch (err: any) {
      console.error("[Intake] Synthesis error:", err);
      setError(err.message || "Failed to generate clinical report");
    } finally {
      setIsProcessing(false);
      disconnectVitals();
    }
  }, [vitals, patientInfo, sessionId, disconnectVitals]);

  /**
   * Submit to blockchain (The Shield Implementation)
   */
  const handleBlockchainSubmit = useCallback(async () => {
    if (!clinicalReport) {
      setError("No report to submit");
      return;
    }

    setIsProcessing(true);
    setVerificationError(null);

    try {
      // Submit to Kairo blockchain
      const result = await submitReportToBlockchain(sessionId, {
        sessionId,
        patientInfo,
        report: clinicalReport,
        vitals,
        reportHash,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        setBlockchainTxHash(result.transactionHash);
        setPhase(IntakePhase.COMPLETE);
        console.log("[Shield] Report verified on blockchain:", result.transactionHash);
      } else {
        throw new Error("Blockchain submission failed");
      }
    } catch (err: any) {
      console.error("[Shield] Verification error:", err);
      setVerificationError(err.message || "Failed to verify on blockchain");
    } finally {
      setIsProcessing(false);
    }
  }, [clinicalReport, sessionId, patientInfo, vitals, reportHash]);

  /**
   * Calculate age from date of birth
   */
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-black" />
              <span className="text-2xl font-bold text-black">Aegis Health</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Session: {sessionId.slice(0, 12)}...</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/")}
                className="text-gray-600 hover:text-black"
              >
                Exit
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {[
              { phase: IntakePhase.PATIENT_INFO, label: "Patient Info", icon: User },
              { phase: IntakePhase.APPOINTMENT, label: "Book Appointment", icon: Calendar },
              { phase: IntakePhase.TRIAGE, label: "Live Triage", icon: Activity },
              { phase: IntakePhase.SYNTHESIS, label: "Synthesis", icon: FileText },
              { phase: IntakePhase.VERIFICATION, label: "Verification", icon: Lock },
              { phase: IntakePhase.COMPLETE, label: "Complete", icon: CheckCircle2 }
            ].map(({ phase: p, label, icon: Icon }, index) => {
              const isActive = phase === p;
              const isComplete = Object.values(IntakePhase).indexOf(phase) > index;
              
              return (
                <div key={p} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${
                    isActive 
                      ? "bg-black text-white" 
                      : isComplete
                      ? "bg-gray-200 text-gray-700"
                      : "bg-white border border-gray-300 text-gray-500"
                  }`}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  {index < 5 && (
                    <div className={`h-0.5 w-8 ${isComplete ? "bg-gray-300" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {(error || verificationError) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-600 font-medium">Error</p>
              <p className="text-red-500 text-sm">{error || verificationError}</p>
            </div>
          </div>
        )}

        {/* Phase 1: Patient Information */}
        {phase === IntakePhase.PATIENT_INFO && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-black mb-3">
                  Patient Information
                </h1>
                <p className="text-gray-600">
                  Please provide your information to begin the intake process.
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700">
                      First Name <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="firstName"
                        value={patientInfo.firstName}
                        onChange={(e) => setPatientInfo({ ...patientInfo, firstName: e.target.value })}
                        className="pl-10 bg-white border-gray-300 text-black"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-700">
                      Last Name <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="lastName"
                        value={patientInfo.lastName}
                        onChange={(e) => setPatientInfo({ ...patientInfo, lastName: e.target.value })}
                        className="pl-10 bg-white border-gray-300 text-black"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-gray-700">
                    Date of Birth <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="dob"
                      type="date"
                      value={patientInfo.dateOfBirth}
                      onChange={(e) => setPatientInfo({ ...patientInfo, dateOfBirth: e.target.value })}
                      className="pl-10 bg-white border-gray-300 text-black"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={patientInfo.phone}
                      onChange={(e) => setPatientInfo({ ...patientInfo, phone: e.target.value })}
                      className="pl-10 bg-white border-gray-300 text-black"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={patientInfo.email}
                      onChange={(e) => setPatientInfo({ ...patientInfo, email: e.target.value })}
                      className="pl-10 bg-white border-gray-300 text-black"
                      placeholder="john.doe@example.com"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleStartTriage}
                  className="w-full bg-black hover:bg-gray-800 text-white py-6 text-lg"
                  size="lg"
                >
                  Continue to Appointment
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By continuing, you agree to our Terms of Service and HIPAA Privacy Notice
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phase 2: Appointment Booking */}
        {phase === IntakePhase.APPOINTMENT && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="text-center mb-8">
                <Calendar className="h-12 w-12 text-black mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-black mb-3">
                  Book Your Appointment
                </h1>
                <p className="text-gray-600">
                  Select a date and time for your visit. We'll conduct a live intake assessment before your appointment.
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="appointmentType" className="text-gray-700">
                    Appointment Type <span className="text-red-600">*</span>
                  </Label>
                  <select
                    id="appointmentType"
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value)}
                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    <option value="general">General Consultation</option>
                    <option value="followup">Follow-up Visit</option>
                    <option value="urgent">Urgent Care</option>
                    <option value="specialist">Specialist Referral</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointmentDate" className="text-gray-700">
                      Preferred Date <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                      <Input
                        id="appointmentDate"
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="pl-10 bg-white border-gray-300 text-black"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appointmentTime" className="text-gray-700">
                      Preferred Time <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                      <Input
                        id="appointmentTime"
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="pl-10 bg-white border-gray-300 text-black"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-black mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-black font-medium text-sm">Pre-Visit Intake Assessment</p>
                      <p className="text-gray-600 text-xs mt-1">
                        After booking, you'll complete a 5-minute live triage session with our AI assistant 
                        to help your physician prepare for your visit.
                      </p>
                    </div>
                  </div>
                </div>

                {appointmentDate && appointmentTime && (
                  <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-2">Appointment Summary</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-black font-medium">
                          {new Date(appointmentDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-gray-600 text-sm">{appointmentTime} • {appointmentType}</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-black" />
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    onClick={() => setPhase(IntakePhase.PATIENT_INFO)}
                    variant="outline"
                    className="flex-1 border-gray-300 text-black hover:bg-gray-50"
                    size="lg"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirmAppointment}
                    className="flex-1 bg-black hover:bg-gray-800 text-white py-6 text-lg"
                    size="lg"
                  >
                    Confirm & Start Intake
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Appointment subject to availability. You'll receive confirmation via email.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Live Triage */}
        {phase === IntakePhase.TRIAGE && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column: Voice Interface */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-black">Talk to Emi</h2>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black text-white border border-gray-300">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-sm">Live</span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Speak naturally about your symptoms, concerns, or reason for visit. 
                  Emi is here to listen and help.
                </p>

                <VoiceInterface
                  onConversationEnd={handleConversationEnd}
                  onTranscriptUpdate={handleTranscriptUpdate}
                  isActive={true}
                />

                {/* Transcript Display */}
                {transcript.length > 0 && (
                  <div className="mt-6 space-y-3 max-h-64 overflow-y-auto">
                    {transcript.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-gray-50 border border-gray-200"
                            : "bg-black/5 border border-black/10"
                        }`}
                      >
                        <p className={`text-sm ${
                          msg.role === "user" ? "text-gray-700" : "text-gray-900"
                        }`}>
                          <span className="font-medium">
                            {msg.role === "user" ? "You" : "Emi"}:
                          </span>{" "}
                          {msg.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Vitals Monitor */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-black">Contactless Vitals</h2>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-300">
                    <Activity className="h-4 w-4 text-black" />
                    <span className="text-sm text-black">Presage rPPG</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  Look at your camera while talking. We'll measure your vitals contactlessly.
                </p>

                <VitalMonitor
                  vitals={vitals}
                  isConnected={vitalsConnected}
                  isCalibrating={isCalibrating}
                  signalQuality={signalQuality}
                  videoRef={videoRef}
                  onConnect={connectVitals}
                  onDisconnect={disconnectVitals}
                />
              </div>

              {/* Privacy Notice */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-black mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-black font-medium text-sm">Privacy Protected</p>
                    <p className="text-gray-600 text-xs mt-1">
                      Your video is processed locally and never stored. Only vitals and transcript 
                      are saved, then hashed for blockchain verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 4: Clinical Synthesis */}
        {phase === IntakePhase.SYNTHESIS && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <Loader2 className="h-12 w-12 text-black animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-black mb-3">
                Synthesizing Your Clinical Report
              </h2>
              <p className="text-gray-600">
                Gemini AI is analyzing your conversation and vitals to generate a structured 
                clinical intake report. This will take just a moment...
              </p>
            </div>
          </div>
        )}

        {/* Phase 5: Verification */}
        {phase === IntakePhase.VERIFICATION && clinicalReport && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-black mb-6">
                Your Clinical Intake Report
              </h2>
              
              {/* Clinical Report Display */}
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Chief Complaint</h3>
                  <p className="text-gray-700">{clinicalReport.chiefComplaint}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Clinical Summary</h3>
                  <p className="text-gray-700">{clinicalReport.summary}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Symptoms</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {clinicalReport.symptoms.map((symptom, idx) => (
                      <li key={idx} className="text-gray-700">{symptom}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Vital Signs</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {clinicalReport.vitals.heartRate && (
                      <div>
                        <p className="text-xs text-gray-500">Heart Rate</p>
                        <p className="text-lg text-black">{clinicalReport.vitals.heartRate} bpm</p>
                      </div>
                    )}
                    {clinicalReport.vitals.oxygenSaturation && (
                      <div>
                        <p className="text-xs text-gray-500">SpO2</p>
                        <p className="text-lg text-black">{clinicalReport.vitals.oxygenSaturation}%</p>
                      </div>
                    )}
                    {clinicalReport.vitals.respiratoryRate && (
                      <div>
                        <p className="text-xs text-gray-500">Respiratory Rate</p>
                        <p className="text-lg text-black">{clinicalReport.vitals.respiratoryRate} /min</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Clinical Impression</h3>
                  <p className="text-gray-700">{clinicalReport.clinicalImpression}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Recommendations</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {clinicalReport.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between bg-gray-100 border border-gray-300 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Triage Level</p>
                    <p className="text-lg text-black font-bold capitalize">{clinicalReport.triageLevel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 font-medium">Confidence</p>
                    <p className="text-lg text-black font-bold">{(clinicalReport.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="flex items-start gap-4">
                  <Shield className="h-8 w-8 text-black flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-black mb-2">
                      The Shield: Blockchain Verification
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      We'll create a cryptographic hash of your report and store it on Kairo's blockchain, 
                      establishing an immutable "Source of Truth" for your medical documentation.
                    </p>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-500 mb-1">SHA-256 Hash:</p>
                      <p className="text-xs text-black font-mono break-all">{reportHash}</p>
                    </div>

                    <Button
                      onClick={handleBlockchainSubmit}
                      disabled={isProcessing}
                      className="w-full bg-black hover:bg-gray-800 text-white"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting to Blockchain...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Verify on Blockchain
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 6: Complete */}
        {phase === IntakePhase.COMPLETE && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-black mb-3">
                Intake Complete!
              </h2>
              <p className="text-gray-600 mb-8">
                Your clinical report has been verified on the blockchain. You're all set for your appointment.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Session ID</p>
                    <p className="text-sm text-gray-900 font-mono">{sessionId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Blockchain Transaction</p>
                    <p className="text-sm text-black font-mono break-all">{blockchainTxHash}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Report Hash</p>
                    <p className="text-sm text-black font-mono break-all">{reportHash}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="border-gray-300 text-black hover:bg-gray-50"
                >
                  Return Home
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  Download Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
