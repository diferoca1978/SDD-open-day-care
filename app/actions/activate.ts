"use server";

import { createClient } from "@supabase/supabase-js";

export type ActivateState = { error: string | null; success?: boolean };

export type InvitationView = {
  code: string;
  childName: string;
  daycareName: string;
  parentEmail: string;
  expiresAt: string;
  childId: string;
  daycareId: string;
};

export async function getInvitationByCode(code: string): Promise<InvitationView | null> {
  if (!code || typeof code !== "string") {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: invitation, error } = await supabase.rpc("get_invitation_by_code", {
    p_code: code.toUpperCase(),
  });

  if (error || !invitation) {
    return null;
  }

  return {
    code: invitation.code,
    childName: invitation.child_name || "",
    daycareName: invitation.daycare_name || "",
    parentEmail: invitation.parent_email,
    expiresAt: new Date(invitation.expires_at).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    childId: invitation.child_id,
    daycareId: invitation.daycare_id,
  };
}

export async function activateAccount(
  _previousState: ActivateState,
  formData: FormData,
): Promise<ActivateState> {
  const code = formData.get("code");
  const email = formData.get("email");
  const password = formData.get("password");
  const photoConsent = formData.get("photoConsent");

  if (!code || typeof code !== "string") {
    return { error: "Código de invitación no válido." };
  }
  if (!email || typeof email !== "string" || !email.trim()) {
    return { error: "Ingresa un email." };
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Validate invitation using the mapped helper (handles snake_case → camelCase)
  const invitation = await getInvitationByCode(code);

  if (!invitation) {
    return { error: "Código de invitación no válido o expirado." };
  }

  if (invitation.parentEmail.toLowerCase() !== email.trim().toLowerCase()) {
    return { error: "El email no coincide con la invitación." };
  }

  // Create user with service role (bypasses RLS, fires trigger with correct metadata)
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: email.trim(),
    password: password,
    email_confirm: true,
    user_metadata: {
      daycare_id: invitation.daycareId,
      full_name: email.trim().split("@")[0],
      role: "parent",
      photo_consent: photoConsent === "on",
    },
  });

  let userId: string;

  if (authError || !authData.user) {
    if (authError?.message?.includes("already registered") || authError?.message?.includes("already been registered")) {
      // User already exists from a previous attempt — find their ID
      const { data: usersList } = await adminSupabase.auth.admin.listUsers();
      const existingUser = usersList?.users.find((u) => u.email === email.trim());
      if (!existingUser) {
        return { error: "Este email ya tiene una cuenta." };
      }
      userId = existingUser.id;

      const { error: updateAuthError } = await adminSupabase.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });

      if (updateAuthError) {
        return { error: "No se pudo actualizar la contraseña de la cuenta." };
      }
    } else {
      return { error: authError?.message || "No se pudo crear la cuenta." };
    }
  } else {
    userId = authData.user.id;
  }

  // Ensure user profile exists in public.users (trigger should have created it via handle_new_user)
  const { data: existingProfile } = await adminSupabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (!existingProfile) {
    const { error: profileError } = await adminSupabase.from("users").insert({
      id: userId,
      daycare_id: invitation.daycareId,
      role: "parent",
      full_name: email.trim().split("@")[0],
    });

    if (profileError) {
      return { error: "No se pudo crear el perfil de usuario: " + profileError.message };
    }
  }

  // Insert parent_child relationship (upsert to handle retries)
  const { error: linkError } = await adminSupabase.from("parent_child").upsert({
    user_id: userId,
    child_id: invitation.childId,
    role: "parent",
  }, { onConflict: "user_id,child_id" });

  if (linkError) {
    return { error: "No se pudo vincular al niño: " + linkError.message };
  }

  // Update invitation status
  const { error: updateError } = await adminSupabase
    .from("invitations")
    .update({ status: "accepted" })
    .eq("code", code.toUpperCase())
    .eq("status", "pending");

  if (updateError) {
    return { error: "La cuenta se creó pero no se pudo actualizar la invitación." };
  }

  // Return success instead of redirecting — the current session (staff user)
  // would be redirected back to / by the middleware if we went to /login.
  // The user must sign out manually and log in as the new parent.
  return { error: null, success: true };
}
