"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { EmiTerminal } from "@/components/emi/EmiTerminal";
import { getAppointment, getIntakeSession, updateIntakeSession } from "@/lib/supabase";

interface AppointmentData {
  id: string;
  service_type: "general_checkup" | "urgent_care";
  scheduled_time: string;
  status: string;
  patient: {
    id: string;
    name: string;
    email: string;
  };
  intake_session: Array<{
    id: string;
    status: string;
  }>;
}

export default function IntakePage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const fetchAppointment = useCallback(async () => {
    try {
      const data = await getAppointment(appointmentId);
      setAppointment(data as AppointmentData);

      // Mark intake session as in_progress when starting
      if (data?.intake_session?.[0]?.status === "pending") {
        await updateIntakeSession(data.intake_session[0].id, {
          status: "in_progress",
          started_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Failed to fetch appointment:", err);
      setError("Appointment not found");
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  const intakeSession = appointment?.intake_session?.[0];
  const isComplete = intakeSession?.status === "completed";

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="page-gradient min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading intake session...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="page-gradient min-h-screen flex items-center justify-center">
        <div className="text-center premium-card p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Session Not Found</h2>
          <p className="text-slate-500 mb-6">
            We couldn&apos;t find this intake session. Please return to your dashboard.
          </p>
          <Link href="/" className="btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-gradient min-h-screen">
      {/* Compact Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/${appointmentId}`}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800">
                {appointment.patient.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatTime(appointment.scheduled_time)}
              </p>
            </div>
            <span className="badge badge-info">
              {appointment.service_type === "general_checkup"
                ? "General Checkup"
                : "Urgent Care"}
            </span>
          </div>
        </div>
      </header>

      {/* Pre-start Screen */}
      {!hasStarted && !isComplete && (
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="premium-card p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              Ready for Your AI Pre-Screening?
            </h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Speak naturally with Emi, our AI intake assistant. She&apos;ll gather information
              about your symptoms and help prepare you for your upcoming visit.
            </p>

            <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-slate-800 mb-4">Before you begin:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-slate-600">
                    Find a quiet, well-lit space for the best experience
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-slate-600">
                    Allow microphone access when prompted
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-slate-600">
                    Optionally enable camera for vital sign monitoring
                  </span>
                </li>
              </ul>
            </div>

            <button onClick={() => setHasStarted(true)} className="btn-cta">
              Start Pre-Screening
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </button>

            <p className="text-xs text-slate-400 mt-6">
              This session is HIPAA compliant and your data is encrypted
            </p>
          </div>
        </div>
      )}

      {/* Completed Screen */}
      {isComplete && (
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="premium-card p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-emerald-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              Pre-Screening Complete
            </h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Thank you for completing your AI pre-screening. Your provider will review this
              information before your visit.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/dashboard/${appointmentId}`} className="btn-primary">
                Return to Dashboard
              </Link>
              <button
                onClick={() => setHasStarted(true)}
                className="btn-secondary"
              >
                Review Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EmiTerminal Interface */}
      {hasStarted && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0066CC] to-[#0055A4] flex items-center justify-center">
                  <span className="text-white font-bold">E</span>
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">Virtual Intake Room</h2>
                  <p className="text-xs text-slate-500">
                    Speak naturally with Emi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm text-slate-500">Session Active</span>
              </div>
            </div>

            <EmiTerminal />
          </div>

          <div className="mt-6 text-center">
            <Link
              href={`/dashboard/${appointmentId}`}
              className="text-slate-500 hover:text-slate-700 font-medium text-sm"
            >
              Exit and return to dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
