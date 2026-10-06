"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type LoginState = { error: string | null };

export async function signIn(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const supabase = createClient(await cookies());

  console.log("signIn called with email:", email);

  // Sign out any existing session before signing in
  await supabase.auth.signOut();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: typeof email === "string" ? email : "",
    password: typeof password === "string" ? password : "",
  });

  console.log("signIn result:", { data: data?.user?.email, error: error?.message });

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = createClient(await cookies());

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
