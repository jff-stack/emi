"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAppointment,
  getIntakeSession,
  uploadMedicalImage,
  addMedicalImageToSession,
} from "@/lib/supabase";

interface AppointmentData {
  id: string;
  service_type: "general_checkup" | "urgent_care";
  scheduled_time: string;
  reason?: string;
  status: string;
  patient: {
    id: string;
    name: string;
    email: string;
  };
  intake_session: Array<{
    id: string;
    status: string;
    medical_images?: string[];
  }>;
}

export default function PatientDashboard() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fetchAppointment = useCallback(async () => {
    try {
      const data = await getAppointment(appointmentId);
      setAppointment(data as AppointmentData);
      if (data?.intake_session?.[0]?.medical_images) {
        setUploadedImages(data.intake_session[0].medical_images);
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

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !appointment) return;

    const intakeSession = appointment.intake_session?.[0];
    if (!intakeSession) {
      setError("No intake session found");
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          continue;
        }

        const publicUrl = await uploadMedicalImage(appointmentId, file);
        await addMedicalImageToSession(intakeSession.id, publicUrl);
        setUploadedImages((prev) => [...prev, publicUrl]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const intakeSession = appointment?.intake_session?.[0];
  const isIntakeComplete = intakeSession?.status === "completed";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="page-gradient min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
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
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Appointment Not Found</h2>
          <p className="text-slate-500 mb-6">
            We couldn&apos;t find this appointment. It may have been cancelled or the link is
            incorrect.
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
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0066CC] to-[#0055A4] flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Emi Health</h1>
              <p className="text-xs text-slate-500">Patient Portal</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Welcome, {appointment?.patient?.name?.split(" ")[0]}
            </span>
            <Link href="/" className="text-slate-500 hover:text-slate-700 font-medium text-sm">
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Confirmation Banner */}
        <div className="premium-card p-6 mb-8 border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-emerald-600"
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
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-1">
                Appointment Confirmed
              </h2>
              <p className="text-slate-600">
                {formatDate(appointment!.scheduled_time)} at{" "}
                {formatTime(appointment!.scheduled_time)}
              </p>
              <div className="mt-3 flex items-center gap-4">
                <span className="badge badge-info">
                  {appointment!.service_type === "general_checkup"
                    ? "General Checkup"
                    : "Urgent Care"}
                </span>
                <span className="badge badge-neutral capitalize">{appointment!.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* AI Pre-Screening Card */}
          <div className="premium-card p-6">
            <div className="flex items-start gap-4 mb-6">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isIntakeComplete ? "bg-emerald-100" : "bg-blue-100"
                }`}
              >
                {isIntakeComplete ? (
                  <svg
                    className="w-6 h-6 text-emerald-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">AI Pre-Screening</h3>
                <p className="text-sm text-slate-500">
                  {isIntakeComplete
                    ? "Your pre-screening is complete"
                    : "Speak with Emi, our AI intake assistant"}
                </p>
              </div>
            </div>

            {isIntakeComplete ? (
              <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Screening Complete</span>
                </div>
                <p className="text-sm text-emerald-600 mt-1">
                  Your provider will review this before your visit.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-4">
                Complete your virtual intake to help your provider prepare for your visit. This
                typically takes 5-10 minutes.
              </p>
            )}

            <Link
              href={`/intake/${appointmentId}`}
              className={`w-full ${isIntakeComplete ? "btn-secondary" : "btn-primary"}`}
            >
              {isIntakeComplete ? "View Screening Results" : "Start AI Pre-Screening"}
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {/* Medical Images Card */}
          <div className="premium-card p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Medical Images</h3>
                <p className="text-sm text-slate-500">Upload relevant photos for your visit</p>
              </div>
            </div>

            {/* Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`${isDragging ? "upload-zone-active" : "upload-zone"} mb-4`}
            >
              <input
                type="file"
                id="image-upload"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploadingImage}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                {uploadingImage ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                    <p className="text-slate-500">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <svg
                      className="w-10 h-10 text-slate-400 mx-auto mb-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-slate-600 font-medium">
                      Drag & drop images or click to upload
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                  </>
                )}
              </label>
            </div>

            {/* Uploaded Images */}
            {uploadedImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  Uploaded ({uploadedImages.length})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {uploadedImages.map((url, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg bg-slate-100 overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`Uploaded ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Appointment Details */}
        <div className="premium-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Appointment Details</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-500">Patient Name</label>
                <p className="font-medium text-slate-800">{appointment?.patient?.name}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Email</label>
                <p className="font-medium text-slate-800">{appointment?.patient?.email}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Service Type</label>
                <p className="font-medium text-slate-800">
                  {appointment?.service_type === "general_checkup"
                    ? "General Checkup"
                    : "Urgent Care"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-500">Date & Time</label>
                <p className="font-medium text-slate-800">
                  {formatDate(appointment!.scheduled_time)}
                  <br />
                  {formatTime(appointment!.scheduled_time)}
                </p>
              </div>
              {appointment?.reason && (
                <div>
                  <label className="text-sm text-slate-500">Reason for Visit</label>
                  <p className="font-medium text-slate-800">{appointment.reason}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 flex gap-4">
            <button className="btn-outline text-sm py-2 px-4">Reschedule</button>
            <button className="text-red-600 hover:text-red-700 font-medium text-sm">
              Cancel Appointment
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Need help?{" "}
            <a href="#" className="link-trust">
              Contact Support
            </a>{" "}
            or call{" "}
            <a href="tel:1-800-EMI-CARE" className="link-trust">
              1-800-EMI-CARE
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
