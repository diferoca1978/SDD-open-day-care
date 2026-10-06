"use server";

import { Resend } from "resend";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export type SendInvitationState = {
  error: string | null;
  invitationId: string | null;
  code: string | null;
};

export async function sendInvitation(
  _previousState: SendInvitationState,
  formData: FormData,
): Promise<SendInvitationState> {
  const childId = formData.get("childId");
  const parentName = formData.get("parentName");
  const parentEmail = formData.get("parentEmail");
  const parentRole = formData.get("parentRole");

  if (!childId || typeof childId !== "string") {
    return { error: "Niño no válido.", invitationId: null, code: null };
  }
  if (!parentName || typeof parentName !== "string" || !parentName.trim()) {
    return { error: "Ingresa el nombre del padre o madre.", invitationId: null, code: null };
  }
  if (!parentEmail || typeof parentEmail !== "string" || !parentEmail.trim()) {
    return { error: "Ingresa un email.", invitationId: null, code: null };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
    return { error: "Ingresa un email válido.", invitationId: null, code: null };
  }
  if (!parentRole || typeof parentRole !== "string") {
    return { error: "Selecciona un parentesco.", invitationId: null, code: null };
  }

  const supabase = createClient(await cookies());

  // Get current user's daycare_id
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("daycare_id, role")
    .eq("id", (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (userError || !userData) {
    return { error: "No se pudo verificar el usuario.", invitationId: null, code: null };
  }

  if (userData.role !== "staff" && userData.role !== "admin") {
    return { error: "No tienes permisos para enviar invitaciones.", invitationId: null, code: null };
  }

  // Generate invitation code
  const { data: codeData, error: codeError } = await supabase.rpc("generate_invitation_code");

  if (codeError || !codeData) {
    return { error: "No se pudo generar el código.", invitationId: null, code: null };
  }

  const code = codeData;

  // Insert invitation
  const { data: invitation, error: insertError } = await supabase
    .from("invitations")
    .insert({
      daycare_id: userData.daycare_id,
      child_id: childId,
      parent_email: parentEmail.trim(),
      parent_name: parentName.trim(),
      parent_role: parentRole,
      code: code,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
    })
    .select()
    .single();

  if (insertError || !invitation) {
    return { error: "No se pudo crear la invitación.", invitationId: null, code: null };
  }

  // Get child name for the email
  const { data: childData } = await supabase
    .from("children")
    .select("full_name")
    .eq("id", childId)
    .single();

  const childName = childData?.full_name || "tu hijo";

  // Send email via Resend
  const { error: emailError } = await resend.emails.send({
    from: "OpenDayCare <onboarding@resend.dev>",
    to: [parentEmail.trim()],
    subject: "Te invitaron a OpenDayCare",
    html: `
      <p>Hola ${parentName.trim()},</p>
      <p>Te invitaron a seguir el día de ${childName} en OpenDayCare.</p>
      <p>Tu código de invitación es: <strong>${code}</strong></p>
      <p>Este código vence en 7 días.</p>
      <p>Para activar tu cuenta, visita: <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/activate?code=${code}">Activar cuenta</a></p>
    `,
  });

  if (emailError) {
    // Email failed but invitation was created - return the code anyway
    return {
      error: "La invitación se creó pero no se pudo enviar el correo. El código es: " + code,
      invitationId: invitation.id,
      code: code,
    };
  }

  return {
    error: null,
    invitationId: invitation.id,
    code: code,
  };
}
