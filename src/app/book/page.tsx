"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createPatient, createAppointment, createIntakeSession } from "@/lib/supabase";

type ServiceType = "general_checkup" | "urgent_care";

interface BookingData {
  service: ServiceType | null;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  reason: string;
}

const AVAILABLE_TIMES = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
];

function getNextWeekDates() {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      value: date.toISOString().split("T")[0],
      label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    });
  }
  return dates;
}

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingData>({
    service: null,
    date: "",
    time: "",
    name: "",
    email: "",
    phone: "",
    reason: "",
  });

  const availableDates = getNextWeekDates();

  // Pre-select service from URL query param
  useEffect(() => {
    const service = searchParams.get("service");
    if (service === "general_checkup" || service === "urgent_care") {
      setBookingData((prev) => ({ ...prev, service }));
      setStep(2);
    }
  }, [searchParams]);

  const updateBooking = (field: keyof BookingData, value: string) => {
    setBookingData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return bookingData.service !== null;
      case 2:
        return bookingData.date !== "" && bookingData.time !== "";
      case 3:
        return bookingData.name.trim() !== "" && bookingData.email.trim() !== "";
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!canProceed() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create patient
      const patient = await createPatient({
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone || undefined,
      });

      // Create appointment
      const scheduledTime = new Date(`${bookingData.date}T${convertTo24Hour(bookingData.time)}`);
      const appointment = await createAppointment({
        patient_id: patient.id,
        service_type: bookingData.service!,
        scheduled_time: scheduledTime.toISOString(),
        reason: bookingData.reason || undefined,
      });

      // Create intake session
      await createIntakeSession(appointment.id);

      // Redirect to dashboard
      router.push(`/dashboard/${appointment.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("Booking error:", errorMessage, err);
      setError(`Failed to book appointment: ${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  const convertTo24Hour = (time12: string) => {
    const [time, modifier] = time12.split(" ");
    const [hours, minutes] = time.split(":");
    let hoursNum = parseInt(hours, 10);
    if (modifier === "PM" && hoursNum !== 12) hoursNum += 12;
    if (modifier === "AM" && hoursNum === 12) hoursNum = 0;
    return `${hoursNum.toString().padStart(2, "0")}:${minutes}:00`;
  };

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
              <p className="text-xs text-slate-500">Virtual Care</p>
            </div>
          </Link>

          <Link href="/" className="text-slate-500 hover:text-slate-700 font-medium">
            Cancel
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <button
                  onClick={() => s < step && setStep(s)}
                  className={`${s === step
                      ? "step-indicator-active"
                      : s < step
                        ? "step-indicator-complete"
                        : "step-indicator-pending"
                    }`}
                  disabled={s > step}
                >
                  {s < step ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    s
                  )}
                </button>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 rounded-full ${s < step ? "bg-emerald-500" : "bg-gray-200"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-3">Select a Service</h2>
              <p className="text-slate-500">Choose the type of care you need</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => updateBooking("service", "general_checkup")}
                className={`service-card p-8 text-left ${bookingData.service === "general_checkup" ? "service-card-selected" : ""
                  }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <svg
                    className="w-7 h-7 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">General Checkup</h3>
                <p className="text-slate-500 text-sm">
                  Routine wellness visits, preventive care, and health screenings.
                </p>
                {bookingData.service === "general_checkup" && (
                  <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Selected
                  </div>
                )}
              </button>

              <button
                onClick={() => updateBooking("service", "urgent_care")}
                className={`service-card p-8 text-left ${bookingData.service === "urgent_care" ? "service-card-selected" : ""
                  }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                  <svg
                    className="w-7 h-7 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Urgent Care</h3>
                <p className="text-slate-500 text-sm">
                  For non-emergency issues that need quick attention.
                </p>
                {bookingData.service === "urgent_care" && (
                  <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Selected
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Time */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-3">Select a Time</h2>
              <p className="text-slate-500">Choose a date and time that works for you</p>
            </div>

            <div className="premium-card p-6 mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">Select Date</label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {availableDates.map((date) => (
                  <button
                    key={date.value}
                    onClick={() => updateBooking("date", date.value)}
                    className={`p-3 rounded-lg text-center transition-all ${bookingData.date === date.value
                        ? "bg-blue-600 text-white"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                      }`}
                  >
                    <span className="block text-xs">{date.label.split(" ")[0]}</span>
                    <span className="block font-semibold">{date.label.split(" ")[2]}</span>
                  </button>
                ))}
              </div>
            </div>

            {bookingData.date && (
              <div className="premium-card p-6 animate-fade-in-up">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Available Times
                </label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {AVAILABLE_TIMES.map((time) => (
                    <button
                      key={time}
                      onClick={() => updateBooking("time", time)}
                      className={`${bookingData.time === time ? "time-slot-selected" : "time-slot"
                        }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Patient Details */}
        {step === 3 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-3">Your Information</h2>
              <p className="text-slate-500">Tell us a bit about yourself</p>
            </div>

            <div className="premium-card p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bookingData.name}
                    onChange={(e) => updateBooking("name", e.target.value)}
                    placeholder="John Doe"
                    className="input-premium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={bookingData.email}
                    onChange={(e) => updateBooking("email", e.target.value)}
                    placeholder="john@example.com"
                    className="input-premium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={bookingData.phone}
                    onChange={(e) => updateBooking("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                    className="input-premium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason for Visit
                  </label>
                  <textarea
                    value={bookingData.reason}
                    onChange={(e) => updateBooking("reason", e.target.value)}
                    placeholder="Briefly describe your symptoms or reason for the appointment..."
                    rows={3}
                    className="input-premium resize-none"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="font-semibold text-slate-800 mb-4">Appointment Summary</h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service</span>
                    <span className="font-medium text-slate-800">
                      {bookingData.service === "general_checkup"
                        ? "General Checkup"
                        : "Urgent Care"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date</span>
                    <span className="font-medium text-slate-800">
                      {new Date(bookingData.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time</span>
                    <span className="font-medium text-slate-800">{bookingData.time}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="btn-secondary">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={`btn-primary ${!canProceed() ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Continue
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
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className={`btn-success ${!canProceed() || isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="w-5 h-5 mr-2 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Booking...
                </>
              ) : (
                <>
                  Confirm Booking
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingFallback() {
  return (
    <div className="page-gradient min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">Loading booking...</p>
      </div>
    </div>
  );
}

export default function BookAppointment() {
  return (
    <Suspense fallback={<BookingFallback />}>
      <BookingContent />
    </Suspense>
  );
}
