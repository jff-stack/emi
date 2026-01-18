import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create client lazily to avoid build-time errors when env vars aren't set
let _supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// Export for direct access when needed
export const supabase = { get: getClient };

/**
 * Database Types
 */
export interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  service_type: "general_checkup" | "urgent_care";
  scheduled_time: string;
  reason?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  created_at: string;
}

export interface IntakeSession {
  id: string;
  appointment_id: string;
  status: "pending" | "in_progress" | "completed";
  transcript?: string;
  vitals_data?: Record<string, unknown>;
  clinical_report?: Record<string, unknown>;
  medical_images?: string[];
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

/**
 * Patient operations
 */
export async function createPatient(data: {
  name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
}) {
  const { data: patient, error } = await getClient()
    .from("patients")
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return patient as Patient;
}

export async function getPatient(id: string) {
  const { data, error } = await getClient()
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Patient;
}

/**
 * Appointment operations
 */
export async function createAppointment(data: {
  patient_id: string;
  service_type: "general_checkup" | "urgent_care";
  scheduled_time: string;
  reason?: string;
}) {
  const { data: appointment, error } = await getClient()
    .from("appointments")
    .insert([{ ...data, status: "scheduled" }])
    .select()
    .single();

  if (error) throw error;
  return appointment as Appointment;
}

export async function getAppointment(id: string) {
  const { data, error } = await getClient()
    .from("appointments")
    .select(`
      *,
      patient:patients(*),
      intake_session:intake_sessions(*)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateAppointmentStatus(
  id: string,
  status: Appointment["status"]
) {
  const { data, error } = await getClient()
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Appointment;
}

/**
 * Intake Session operations
 */
export async function createIntakeSession(appointmentId: string) {
  const { data, error } = await getClient()
    .from("intake_sessions")
    .insert([{ appointment_id: appointmentId, status: "pending" }])
    .select()
    .single();

  if (error) throw error;
  return data as IntakeSession;
}

export async function getIntakeSession(appointmentId: string) {
  const { data, error } = await getClient()
    .from("intake_sessions")
    .select("*")
    .eq("appointment_id", appointmentId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data as IntakeSession | null;
}

export async function updateIntakeSession(
  id: string,
  updates: Partial<Omit<IntakeSession, "id" | "appointment_id" | "created_at">>
) {
  const { data, error } = await getClient()
    .from("intake_sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as IntakeSession;
}

export async function completeIntakeSession(
  id: string,
  data: {
    transcript: string;
    vitals_data: Record<string, unknown>;
    clinical_report: Record<string, unknown>;
  }
) {
  const { data: session, error } = await getClient()
    .from("intake_sessions")
    .update({
      ...data,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return session as IntakeSession;
}

/**
 * Medical Image Upload
 */
export async function uploadMedicalImage(
  appointmentId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${appointmentId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await getClient()
    .storage.from("medical-images")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = getClient().storage.from("medical-images").getPublicUrl(fileName);

  return publicUrl;
}

export async function addMedicalImageToSession(
  sessionId: string,
  imageUrl: string
) {
  const { data: session } = await getClient()
    .from("intake_sessions")
    .select("medical_images")
    .eq("id", sessionId)
    .single();

  const currentImages = (session?.medical_images as string[]) || [];

  const { data, error } = await getClient()
    .from("intake_sessions")
    .update({ medical_images: [...currentImages, imageUrl] })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) throw error;
  return data as IntakeSession;
}
